// core node modules

// 3rd party modules
const moment = require('moment');

// internal modules

const buildMomentFromTime = time => moment(time, 'HH:mm');
const getTimeFromDate = (date, format = 'HH:mm') => moment.utc(date).format(format);
const invokeMomentForDate = (date, method) => moment.utc(date)[method]();

const getAllDatesWithDays = ({ begin, end }) => {
  let beginDate = moment(begin);
  const endDate = moment(end);

  const datesAndDays = [];

  while (beginDate.valueOf() < endDate.valueOf()) {
    datesAndDays.push({
      date: beginDate,
      dateWithoutTime: getTimeFromDate(begin, 'YYYY-MM-DD'),
      dayOfWeek: invokeMomentForDate(begin, 'date'),
      beginHm: getTimeFromDate(beginDate),
      endHm: moment(beginDate).endOf('day').format('HH:mm'),
    });

    beginDate = moment(beginDate).add(1, 'days').startOf('day');
  }

  // we still need to update last date with endHm and date,
  // so we can know until when was that last consultation requested
  const lastDay = datesAndDays[datesAndDays.length - 1];
  Object.assign(lastDay, {
    date: endDate,
    endHm: moment(endDate).format('HH:mm'),
  });

  datesAndDays[datesAndDays.length - 1] = lastDay;

  return datesAndDays;
};

const compileTimeIntervalSums = listOfTimes =>
  listOfTimes.map(({ begin, end }) =>
    Math.abs(buildMomentFromTime(begin).diff(buildMomentFromTime(end), 'minutes')));

const intervalValidation = consultationDuration =>
  intervals =>
    intervals.some(interval => interval >= consultationDuration);

const validateTimesLeft = (doctor, room, dateWithoutTime, consultDuration) => {
  const doctorTimeIntervalSums = compileTimeIntervalSums(doctor.timesLeft[dateWithoutTime]);
  const roomTimeIntervalSums = compileTimeIntervalSums(room.timesLeft[dateWithoutTime]);

  const areSomeIntervalsAvailable = intervalValidation(consultDuration);

  let validation = true;

  if (!areSomeIntervalsAvailable(doctorTimeIntervalSums)) {
    Object.assign(doctor, {
      timesLeft: {
        [dateWithoutTime]: 'booked',
      },
    });

    validation = false;
  }

  if (!areSomeIntervalsAvailable(roomTimeIntervalSums)) {
    Object.assign(room, {
      timesLeft: {
        [dateWithoutTime]: 'booked',
      },
    });

    validation = false;
  }

  return validation;
};

module.exports = {
  getAllDatesWithDays,
  buildMomentFromTime,
  getTimeFromDate,
  invokeMomentForDate,
  validateTimesLeft,
  intervalValidation,
};
