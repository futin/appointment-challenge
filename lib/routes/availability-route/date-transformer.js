// core node modules

// 3rd party modules
const moment = require('moment');
const _ = require('lodash');

// internal modules

// some helper functions
const buildMomentFromTime = (time, format = 'HH:mm') => moment(time, format);
const buildMomentUTCFromTime = (time, format = 'HH:mm') => moment.utc(time, format);
const getTimeFromDate = (date, format = 'HH:mm') => moment.utc(date).format(format);
const invokeMomentForDate = (date, method) => moment.utc(date)[method]();

// calculate the time difference in minutes
const timeDifferenceInMinutes = (begin, end) =>
  Math.abs(buildMomentFromTime(begin).diff(buildMomentFromTime(end), 'minutes'));

/**
 * Based on list of provided time slots, transform it into list of minutes
 *
 * @param {Array} listOfTimes   - list of time slots, where each slot is an object -> { begin, end }.
 * @returns {*}
 */
const compileTimeIntervalSums = listOfTimes =>
  listOfTimes.map(({ begin, end }) => timeDifferenceInMinutes(begin, end));

// validates the interval of times, and returns true if there is
// at least one interval that satisfies the requested condition
const intervalValidation = consultationDuration =>
  intervals =>
    intervals.some(interval => interval >= consultationDuration);

/**
 * Based on provied begin/end date, build an array of dates with custom attributes.
 *
 *    {String}  beginHm          - start of the requested availability time, represented in HH:mm
 *    {String}  endHm            - end of the requested availability time, represented in HH:mm
 *    {Boolean} allDay           - indicates if the whole day is available.
 *    {String}  dateWithoutTime  - as the name says... date with no time, represented as YYYY-MM-DD
 *    {Number}  dayOfWeek        - Number that represents day of a week. Sunday - 0, Monday - 1, etc...
 *
 * @param {String} begin   - time to begin with
 * @param {String} end     - time to end with
 * @returns {Array}
 */
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

  _.merge(lastDay, {
    endHm: getTimeFromDate(endDate),
    allDay: false,
  });

  datesAndDays[datesAndDays.length - 1] = lastDay;

  return datesAndDays;
};

const getLimitedDatesWithDays = ({ begin, end }) => {
  let beginDate = moment(begin);
  const endDate = moment(end);

  const datesAndDays = [];

  while (beginDate.valueOf() < endDate.valueOf()) {
    const beginHm = getTimeFromDate(beginDate);
    const endHm = getTimeFromDate(endDate);

    datesAndDays.push({
      beginHm,
      endHm,
      allDay: beginHm === '00:00',
      dateWithoutTime: getTimeFromDate(beginDate, 'YYYY-MM-DD'),
      dayOfWeek: invokeMomentForDate(beginDate, 'day'),
    });

    beginDate = moment.utc(beginDate).add(1, 'days');
  }

  return datesAndDays;
};

/**
 * Based on a provided inputs it validates the doctor's/room's timesLeft intervals.
 * If one of them has no time-slots available, it augments the doctor/room with "booked" property since
 * it can no longer be used for this particular dateWithoutTime.
 *
 * @param doctor
 * @param room
 * @param dateWithoutTime
 * @param consultDuration
 * @returns {boolean}
 */
const validateTimesLeft = (doctor, room, dateWithoutTime, consultDuration) => {
  const doctorTimeIntervalSums = compileTimeIntervalSums(doctor.timesLeft[dateWithoutTime]);
  const roomTimeIntervalSums = compileTimeIntervalSums(room.timesLeft[dateWithoutTime]);

  const areSomeIntervalsAvailable = intervalValidation(consultDuration);

  let validation = true;

  if (!areSomeIntervalsAvailable(doctorTimeIntervalSums)) {
    _.merge(doctor, {
      timesLeft: {
        [dateWithoutTime]: 'booked',
      },
    });

    validation = false;
  }

  if (!areSomeIntervalsAvailable(roomTimeIntervalSums)) {
    _.merge(room, {
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
  getLimitedDatesWithDays,
};
