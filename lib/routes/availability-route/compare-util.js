// core node modules

// 3rd party modules

// internal modules
const { buildMomentFromTime } = require('./date-transformer');

const comparisonMethod = ({ begin: beginA, end: endA }, { begin: beginB, end: endB }) => {
  const beginADate = buildMomentFromTime(beginA);
  const endBDate = buildMomentFromTime(endB);

  // if this rule apply, this time-slots are incompatible, abort
  if (endBDate.isSameOrBefore(beginADate)) {
    return { incompatible: true };
  }

  const endADate = buildMomentFromTime(endA);
  const beginBDate = buildMomentFromTime(beginB);

  let availableBegin;
  let availableEnd;

  // there might be a time-slot here, but it's the last one since in the next iteration
  // beginB will certainly come after endA, so don't need to make unnecessary validations
  if (endBDate.isAfter(endADate)) {
    // this time-slots are incompatible, abort...
    // since any additional validation for B resource will end here for the same A resource.
    if (beginBDate.isSameOrAfter(endADate)) {
      return { incompatible: true, last: true };
    }

    // if beginB happens before endA, that means that endA is between beginB and endB
    // and logically becomes availableEnd
    availableEnd = endA;
  } else {
    // if endB happens before or at the same time as endA, it becomes an available end
    availableEnd = endB;
  }

  // finally, compare begin dates in order to pick available begin
  // a greater time between these two is picked
  if (beginBDate.isSameOrAfter(beginADate)) {
    availableBegin = beginB;
  } else {
    availableBegin = beginA;
  }

  return { incompatible: false, availableBegin, availableEnd };
};

const recalculateResourceTimeLeft = (resourceTimesLeft, { beginHm, endHm }) => {

};

const compileValidTimeInterval = (doctor, room, dateConfig, consultDuration) => {
  const {
    dateWithoutTime, allDay,
  } = dateConfig;
  let { [dateWithoutTime]: doctorConsultationTL } = doctor.timesLeft;
  let { [dateWithoutTime]: roomConsultationTL } = room.timesLeft;

  // is all day available, or only part of it?
  if (!allDay) {
    doctorConsultationTL = recalculateResourceTimeLeft(doctorConsultationTL, dateConfig);
    roomConsultationTL = recalculateResourceTimeLeft(roomConsultationTL, dateConfig);
  }

  for (let i = 0; i < doctorConsultationTL.length; i += 1) {
    const doctorTimeLeft = doctorConsultationTL[i];


    for (let j = 0; j < roomConsultationTL.length; j += 1) {
      const roomTimeLeft = roomConsultationTL[j];

    }
  }


  return availability;
};

module.exports = {
  compileValidTimeInterval,
};
