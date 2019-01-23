// core node modules

// 3rd party modules

// internal modules
const { buildMomentFromTime, timeDifferenceInMinutes } = require('./date-transformer');

const comparisonMethod = ({ begin: beginA, end: endA }, { begin: beginB, end: endB }) => {
  const beginADate = buildMomentFromTime(beginA);
  const endBDate = buildMomentFromTime(endB);

  // if this rule apply, this time-slots are incompatible, abort
  if (endBDate.isSameOrBefore(beginADate)) {
    return { incompatible: true };
  }

  const endADate = buildMomentFromTime(endA);
  const beginBDate = buildMomentFromTime(beginB);

  let begin;
  let end;
  let isLast = false;

  // there might be a time-slot here, but it's the last one since in the next iteration
  // beginB will certainly come after endA, so don't need to make unnecessary validations
  if (endBDate.isAfter(endADate)) {
    isLast = true;
    // this time-slots are incompatible, abort...
    // since any additional validation for B resource will end here for the same A resource.
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
  if (beginBDate.isSameOrAfter(beginADate)) {
    begin = beginB;
  } else {
    begin = beginA;
  }

  return {
    incompatible: false, isLast, begin, end,
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

const compileValidTimeInterval = (doctor, room, dateConfig, consultDuration) => {
  const {
    dateWithoutTime, allDay,
  } = dateConfig;
  let { [dateWithoutTime]: doctorConsultationTL } = doctor.timesLeft;
  let { [dateWithoutTime]: roomConsultationTL } = room.timesLeft;

  // is all day available, or only part of it?
  if (!allDay) {
    doctorConsultationTL = recalculateResourceTimeLeft(doctorConsultationTL, consultDuration, dateConfig);
    roomConsultationTL = recalculateResourceTimeLeft(roomConsultationTL, consultDuration, dateConfig);
  }

  console.log('test');
  return {};
};

module.exports = {
  compileValidTimeInterval,
};
