// core node modules

// 3rd party modules
const moment = require('moment');

// internal modules

const getAllDatesWithDays = ({ begin, end }) => {
  let beginDate = moment(begin);
  const endDate = moment(end);

  const datesAndDays = [];

  while (beginDate.valueOf() < endDate.valueOf()) {
    datesAndDays.push({
      date: beginDate,
      dateWithoutTime: moment(beginDate).format('YYYY-MM-DD'),
      dayOfWeek: beginDate.day(),
      beginHm: moment(beginDate).format('HH:mm'),
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

module.exports = {
  getAllDatesWithDays,
};
