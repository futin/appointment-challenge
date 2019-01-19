// core node modules

// 3rd party modules
const moment = require('moment');

// internal modules
const { connector } = require('../../mongodb');

const loadAll = ({ begin, end }) => {
  const projection = {
    'times._id': 0, _id: 0, __v: 0,
  };

  const doctorPromise = connector.execute('Doctor', 'find', {}, projection);
  const roomsPromise = connector.execute('Room', 'find', {}, projection);

  // filter should return all consultations that might affect availability
  const consultationFilter = {
    $or: [
      {
        // Formula:
        // RB <= CB < RE, where:
        // RB - requested begin,
        // CB - consultation's begin,
        // RE - requested end.
        // so basically, if consultation's beginning is between requested date, return consultation
        $and: [
          {
            begin: { $gte: moment(begin) },
          },
          {
            begin: { $lt: moment(end) },
          },
        ],
      },
      {
        // Formula:
        // CB <= RB < CE, where:
        // RB - requested begin,
        // CB - consultation's begin,
        // CE - consultation's end.
        // if requested beginning is between consultation's date, return consultation
        $and: [
          {
            end: { $gt: moment(begin) },
          },
          {
            begin: { $lte: moment(begin) },
          },
        ],
      },
    ],

  };

  const consultationPromise = connector.execute('Consultation', 'find', consultationFilter, { _id: 0, __v: 0 });

  return Promise.all([doctorPromise, roomsPromise, consultationPromise])
};

module.exports = {
  loadAll,
};
