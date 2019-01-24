// core node modules

// 3rd party modules
const debug = require('debug');
const _ = require('lodash');

// internal modules
const { buildMomentFromTime, buildMomentUTCFromTime, timeDifferenceInMinutes } = require('./date-transformer');
const { updateTimesLeftByResource } = require('./data-transformer');
const {
  loggerNamespaces: { compareUtilNamespace },
} = require('../../config/constants');

const logger = debug(compareUtilNamespace);

/**
 * It's purpose is to compare time slots. There are multiple rules that should be followed when comparing time slots.
 * For example, let's compare next time slots:
 * First:  { begin: 10:00, end: 11:00 }
 * Second: { begin: 10:30. end: 11:15 }
 *
 * a result of this comparison is union of previous two:
 * { begin: 10:30, end: 11:00 }
 *
 * There are use-cases where the times are incompatible (they can't make a valid union). Abort immediately in this case
 * and increment Second resource, since there might be some more compatible time in the next time-slot.
 *
 * There are use-cases where we got to the "last" First resource. A perfect example is the one above.
 * It would make no sense to continue comparison with the next Second resource, since this is 100% incompatible match!
 * Instead, increment the First resource since there might be some more compatible time in the next time-slot.
 *
 * And finally, leftover. Leftover is used for providing more information of leftover time between the union.
 * We are only interested in upper leftover, since that one might impact next comparison.
 *
 * Leftover from example above would be:
 * { type: 'second', value: { begin: 11:00, end: 11:15 }
 *
 * Since we are done with First resource, and there are still some time left on the second resource (15 minutes!),
 * pass it via response as well, it might be useful information
 *
 * @param {String} beginFirst
 * @param {String} endFirst
 * @param {String} beginSecond
 * @param {String} endSecond
 * @returns {*}
 */
const timeSlotsComparison = ({ begin: beginFirst, end: endFirst }, { begin: beginSecond, end: endSecond }) => {
  const beginFirstDate = buildMomentFromTime(beginFirst);
  const endSecondDate = buildMomentFromTime(endSecond);

  // if this rule apply, this time-slots are incompatible, abort ( Second++ )
  if (beginFirstDate.isAfter(endSecondDate)) {
    return { incompatible: true };
  }

  const endFirstDate = buildMomentFromTime(endFirst);
  const beginSecondDate = buildMomentFromTime(beginSecond);

  let end;
  let leftover;
  let isLast = false;

  // there might be a time-slot here, but it's the last one since in the next iteration
  // beginSecond will certainly come after endFirst, so don't need to make unnecessary validations
  if (endSecondDate.isAfter(endFirstDate)) {
    isLast = true;
    // this time-slots are incompatible, abort...
    // since any additional validation for B resource will end up here for the same A resource. ( First++ )
    if (beginSecondDate.isSameOrAfter(endFirstDate)) {
      return { incompatible: true, isLast };
    }

    // if beginSecond happens before endFirst, that means that endFirst is between beginSecond and endSecond
    // and logically becomes availableEnd
    end = endFirst;
  } else {
    // if endSecond happens before or at the same time as endFirst, it becomes an available end
    end = endSecond;
  }

  // finally, compare begin dates in order to pick available begin
  // a greater time between these two is picked
  const begin = beginSecondDate.isSameOrAfter(beginFirstDate) ? beginSecond : beginFirst;

  // calculate upper leftovers
  if (endFirst > end) {
    leftover = {
      type: 'first',
      value: { begin: end, end: endFirst },
    };
  } else if (endSecond > end) {
    leftover = {
      type: 'second',
      value: { begin: end, end: endSecond },
    };
  } else {
    leftover = {};
  }

  return {
    incompatible: false,
    isLast,
    begin,
    end,
    leftover,
  };
};

/**
 * Before we start matching the time-slots, filter out time-slots by requested beginHm/endHm time.
 *
 * @param {Array} resourceTimesLeft
 * @param {Number} consultDuration
 * @param {String} beginHm
 * @param {String} endHm
 * @returns {*}
 */
const recalculateResourceTimesLeft = (resourceTimesLeft, consultDuration, { beginHm, endHm }) => {
  let shouldSkip = false;

  return resourceTimesLeft.reduce((result, timeLeft) => {
    if (shouldSkip) {
      return result;
    }

    const {
      incompatible, isLast, begin, end,
    } = timeSlotsComparison({ begin: beginHm, end: endHm }, timeLeft);

    shouldSkip = isLast;

    if (incompatible) {
      return result;
    }

    // don't save begin/end combination if there is not enough time for consultation
    if (consultDuration > timeDifferenceInMinutes(begin, end)) {
      return result;
    }

    result.push({ begin, end });
    return result;
  }, []);
};

/**
 * This method recursively looks for a match between doctor's and room's provided timesLeft. It
 * also rejects all matched time-slots that are below consultationDuration point.
 *
 * @param {Array} doctorConsultationTL    - a list of doctor's times left time-slots
 * @param {Array} roomConsultationTL      - a list of rooms's times left time-slots
 * @param {Number} consultationDuration   - a requested consultation duration time
 * @returns {Array}
 */
const calculateAvailableSlots = (doctorConsultationTL, roomConsultationTL, consultationDuration) => {
  // create fresh arrays since .splice() is being used
  const dc = doctorConsultationTL.slice();
  const rc = roomConsultationTL.slice();

  /* eslint-disable no-param-reassign, no-unused-expressions */
  return (function availabilityMatcher(result = [], dcCounter = 0, rcCounter = 0) {
    // if we can't compare doctors/rooms anymore, return the current result
    if (dc.length <= dcCounter || rc.length <= rcCounter) {
      return result;
    }

    const docInterval = dc[dcCounter];
    const roomInterval = rc[rcCounter];

    const {
      incompatible, isLast, begin, end, leftover,
    } = timeSlotsComparison(docInterval, roomInterval);

    // do we have a mismatch ?
    if (incompatible) {
      return isLast
        ? availabilityMatcher(result, dcCounter + 1, rcCounter)
        : availabilityMatcher(result, dcCounter, rcCounter + 1);
    }

    // don't save begin/end combination if there is not enough time for consultation
    if (consultationDuration > timeDifferenceInMinutes(begin, end)) {
      return result;
    }

    // store calculated match
    result.push({ begin, end });
    dcCounter += 1;
    rcCounter += 1;

    // lest update dc/rc arrays
    if (_.isEmpty(leftover)) {
      return availabilityMatcher(result, dcCounter, rcCounter);
    }

    const { type, value } = leftover;

    // did we get leftovers from first or second time-slot?
    type === 'first' ? dc.splice(dcCounter, 0, value) : rc.splice(rcCounter, 0, value);

    return availabilityMatcher(result, dcCounter, rcCounter);
  }());
};
/* eslint-enable */

/**
 * Responsible for compiling the valid availability based on multiple parameters.
 *
 * @param {Object} doctor           - Doctor instance, it's timesLeft has been used to match-up the room's timesLeft
 * @param {Object} room             - Room instance, it's timesLeft has been used to match-up the doctors's timesLeft
 * @param {Object} dateConfig       - Object with relevant date configuration
 * @param {Number} consultDuration  - Requested consult duration in minutes
 * @param {String} showIds         - If 'yes', pass doctorId/roomId with every result
 * @returns {*}
 */
const compileValidTimeInterval = (doctor, room, dateConfig, consultDuration, showIds) => {
  const { dateWithoutTime, allDay, dayOfWeek } = dateConfig;
  let { [dateWithoutTime]: doctorConsultationTL } = doctor.timesLeft;
  let { [dateWithoutTime]: roomConsultationTL } = room.timesLeft;

  // is all day available, or only part of it?
  if (!allDay) {
    doctorConsultationTL = recalculateResourceTimesLeft(doctorConsultationTL, consultDuration, dateConfig);
    roomConsultationTL = recalculateResourceTimesLeft(roomConsultationTL, consultDuration, dateConfig);
  }

  if (!(doctorConsultationTL.length && roomConsultationTL.length)) {
    logger('There are no doctors or rooms consultation available');
    return false;
  }

  const availableTimeSlots = calculateAvailableSlots(doctorConsultationTL, roomConsultationTL, consultDuration);

  // now the we got available slots, update timesLeft by these valid time-slots,
  // so they can't be used by other resources
  availableTimeSlots.forEach(({ begin: beginTime, end: endTime }) => {
    const dates = {
      dayOfWeek,
      dateWithoutTime,
      beginTime,
      endTime,
    };
    // update timesLeft on doctor/room
    updateTimesLeftByResource(doctor, dates);
    updateTimesLeftByResource(room, dates);
  });

  const dateFormat = 'YYYY-MM-DD HH:mm';

  return availableTimeSlots.map(({ begin, end }) =>
    Object.assign(
      {
        begin: buildMomentUTCFromTime(`${dateWithoutTime} ${begin}`, dateFormat),
        end: buildMomentUTCFromTime(`${dateWithoutTime} ${end}`, dateFormat),
      },
      showIds === 'yes' && {
        doctorId: doctor.id,
        roomId: room.id,
      },
    ));
};

module.exports = {
  compileValidTimeInterval,
};
