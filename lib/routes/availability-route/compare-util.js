// core node modules

// 3rd party modules

// internal modules
const dateTransformer = require('./date-transformer');

const compileValidTimeInterval = (doctor, room, dateWithoutTime, consultDuration) => {
  const { [dateWithoutTime]: doctorConsultationTL } = doctor.timesLeft;
  const { [dateWithoutTime]: roomConsultationTL } = room.timesLeft;
  // TODO: add real algorithm
  const availability = [{ begin: '12:00', end: '14:00' }];

  // time interval sum in minutes! represents total interval time for specific room/doctor combination
  const atLeastOneIntervalAvailable = dateTransformer.intervalValidation(consultDuration)(availability);

  if (!atLeastOneIntervalAvailable) {
    return false;
  }

  const doctorTimeLeft = [{ begin: '14:00', end: '15:00' }];
  const roomTimeLeft = [{ begin: '11:00', end: '12:00' }];

  Object.assign(doctor, {
    timesLeft: {
      [dateWithoutTime]: doctorTimeLeft,
    },
  });

  Object.assign(room, {
    timesLeft: {
      [dateWithoutTime]: roomTimeLeft,
    },
  });

  return availability;
};

module.exports = {
  compileValidTimeInterval,
};
