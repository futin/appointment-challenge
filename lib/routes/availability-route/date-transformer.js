// core node modules

// 3rd party modules
const moment = require('moment');

// internal modules

const buildMomentFromTime = (time, format = 'HH:mm') => moment(time, format);
const buildMomentUTCFromTime = (time, format = 'HH:mm') => moment.utc(time, format);
const getTimeFromDate = (date, format = 'HH:mm') => moment.utc(date).format(format);
const invokeMomentForDate = (date, method) => moment.utc(date)[method]();

const getAllDatesWithDays = ({ begin, end }) => {
  let beginDate = moment(begin);
  const endDate = moment(end);

  const datesAndDays = [];

  while (beginDate.valueOf() < endDate.valueOf()) {
    const beginHm = getTimeFromDate(beginDate);

    datesAndDays.push({
      beginHm,
      endHm: moment(beginDate).endOf('day').format('HH:mm'),
      allDay: beginHm === '00:00',
      dateWithoutTime: getTimeFromDate(beginDate, 'YYYY-MM-DD'),
      dayOfWeek: invokeMomentForDate(beginDate, 'day'),
    });

    beginDate = moment.utc(beginDate).add(1, 'days').startOf('day');
  }

  // we still need to update last date with endHm
  // so we can know until when was that last consultation requested,
  // and allDay, since the requested date is clearly not available whole day
  const lastDay = datesAndDays[datesAndDays.length - 1];

  Object.assign(lastDay, {
    endHm: moment(endDate).format('HH:mm'),
    allDay: false,
  });

  datesAndDays[datesAndDays.length - 1] = lastDay;

  return datesAndDays;
};

const timeDifferenceInMinutes = (begin, end) =>
  Math.abs(buildMomentFromTime(begin).diff(buildMomentFromTime(end), 'minutes'));

const compileTimeIntervalSums = listOfTimes =>
  listOfTimes.map(({ begin, end }) => timeDifferenceInMinutes(begin, end));

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
  buildMomentUTCFromTime,
  getTimeFromDate,
  invokeMomentForDate,
  validateTimesLeft,
  timeDifferenceInMinutes,
};
