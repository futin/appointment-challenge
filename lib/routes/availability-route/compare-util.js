// core node modules

// 3rd party modules
const debug = require('debug');
const _ = require('lodash');

// internal modules
const { buildMomentFromTime, buildMomentUTCFromTime, timeDifferenceInMinutes } = require('./date-transformer');
const { updateResource } = require('./data-transformer');
const { loggerNamespaces: { compareUtilNamespace } } = require('../../config/constants');

const logger = debug(compareUtilNamespace);

const comparisonMethod = ({ begin: beginA, end: endA }, { begin: beginB, end: endB }) => {
  const beginADate = buildMomentFromTime(beginA);
  const endBDate = buildMomentFromTime(endB);

  // if this rule apply, this time-slots are incompatible, abort ( B++ )
  if (beginADate.isAfter(endBDate)) {
    return { incompatible: true };
  }

  const endADate = buildMomentFromTime(endA);
  const beginBDate = buildMomentFromTime(beginB);

  let end;
  let leftover;
  let isLast = false;

  // there might be a time-slot here, but it's the last one since in the next iteration
  // beginB will certainly come after endA, so don't need to make unnecessary validations
  if (endBDate.isAfter(endADate)) {
    isLast = true;
    // this time-slots are incompatible, abort...
    // since any additional validation for B resource will end up here for the same A resource. ( A++ )
    if (beginBDate.isSameOrAfter(endADate)) {
      return { incompatible: true, isLast };
    }

    // if beginB happens before endA, that means that endA is between beginB and endB
    // and logically becomes availableEnd
    end = endA;
  } else {
    // if endB happens before or at the same time as endA, it becomes an available end
    end = endB;
  }

  // finally, compare begin dates in order to pick available begin
  // a greater time between these two is picked
  const begin = beginBDate.isSameOrAfter(beginADate) ? beginB : beginA;

  // calculate upper leftovers... if any
  if (endA > end) {
    leftover = {
      type: 'first',
      value: { begin: end, end: endA },
    };
  } else if (endB > end) {
    leftover = {
      type: 'second',
      value: { begin: end, end: endB },
    };
  } else {
    leftover = {};
  }

  return {
    incompatible: false, isLast, begin, end, leftover,
  };
};

const recalculateResourceTimeLeft = (resourceTimesLeft, consultDuration, { beginHm, endHm }) => {
  let shouldSkip = false;

  return resourceTimesLeft.reduce((result, timeLeft) => {
    if (shouldSkip) {
      return result;
    }

    const {
      incompatible, isLast, begin, end,
    } = comparisonMethod({ begin: beginHm, end: endHm }, timeLeft);

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

/* eslint-disable no-param-reassign, no-unused-expressions */
const calculateAvailableSlots = (dc, rc, consultationDuration) =>
  (function consultationsCalculator(result = [], dcCounter = 0, rcCounter = 0) {
    // if we can't compare doctors/rooms anymore, return the current result
    if (dc.length <= dcCounter || rc.length <= rcCounter) {
      return result;
    }

    const docInterval = dc[dcCounter];
    const roomInterval = rc[rcCounter];

    const {
      incompatible, isLast, begin, end, leftover,
    } = comparisonMethod(docInterval, roomInterval);

    // do we have a mismatch ?
    if (incompatible) {
      return isLast
        ? consultationsCalculator(result, dcCounter + 1, rcCounter)
        : consultationsCalculator(result, dcCounter, rcCounter + 1);
    }

    // don't save begin/end combination if there is not enough time for consultation
    if (consultationDuration > timeDifferenceInMinutes(begin, end)) {
      return result;
    }

    // sweet, we got availability match!!!
    result.push({ begin, end });
    dcCounter += 1;
    rcCounter += 1;

    // lest update dc/rc arrays
    if (_.isEmpty(leftover)) {
      return consultationsCalculator(result, dcCounter, rcCounter);
    }
    const { type, value } = leftover;

    // did we get leftovers from first time-slot?
    (type === 'first') ? dc.splice(dcCounter, 0, value) : rc.splice(rcCounter, 0, value);

    return consultationsCalculator(result, dcCounter, rcCounter);
  }());
/* eslint-enable */

const compileValidTimeInterval = (doctor, room, dateConfig, consultDuration) => {
  const { dateWithoutTime, allDay, dayOfWeek } = dateConfig;
  let { [dateWithoutTime]: doctorConsultationTL } = doctor.timesLeft;
  let { [dateWithoutTime]: roomConsultationTL } = room.timesLeft;

  // is all day available, or only part of it?
  if (!allDay) {
    doctorConsultationTL = recalculateResourceTimeLeft(doctorConsultationTL, consultDuration, dateConfig);
    roomConsultationTL = recalculateResourceTimeLeft(roomConsultationTL, consultDuration, dateConfig);
  }

  if (!(doctorConsultationTL.length && roomConsultationTL.length)) {
    logger('There are no doctors or rooms consultation available');
    return false;
  }

  const availableTimeSlots = calculateAvailableSlots(
    doctorConsultationTL.slice(),
    roomConsultationTL.slice(),
    consultDuration,
  );

  availableTimeSlots.forEach(({ begin: beginTime, end: endTime }) => {
    const dates = {
      dayOfWeek,
      dateWithoutTime,
      beginTime,
      endTime,
    };
    // update timesLeft on doctor/room
    updateResource(doctor, dates);
    updateResource(room, dates);
  });

  const dateFormat = 'YYYY-MM-DD HH:mm';

  const transformedTimeSlots = availableTimeSlots
    .map(({ begin, end }) => ({
      begin: buildMomentUTCFromTime(`${dateWithoutTime} ${begin}`, dateFormat),
      end: buildMomentUTCFromTime(`${dateWithoutTime} ${end}`, dateFormat),
      doctorId: doctor.id,
      roomId: room.id,
    }));

  return transformedTimeSlots;
};

module.exports = {
  compileValidTimeInterval,
};
