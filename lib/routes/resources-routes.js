// core node modules

// 3rd party modules

// internal modules
const { connector } = require('../mongodb');

const getResources = async (req, res, next) => {
  // remove unnecessary fields
  const projection = {
    'times._id': 0, _id: 0, __v: 0,
  };

  const doctorPromise = connector.execute('Doctor', 'find', {}, projection);
  const roomsPromise = connector.execute('Room', 'find', {}, projection);

  return Promise.all([doctorPromise, roomsPromise])
    .then(([doctors, rooms]) => res.send({ doctors, rooms }))
    .catch(error => next(error));
};

const postResources = async (req, res, next) => {
  const { body: { doctors, rooms } } = req;

  const doctorFilter = { id: { $in: doctors.map(d => d.id) } };
  const roomFilter = { id: { $in: rooms.map(d => d.id) } };

  try {
    await connector.updateMany('Doctor', doctorFilter, doctors);
    await connector.updateMany('Room', roomFilter, rooms);

    res.send({ status: 'Success', message: 'Doctors/Rooms inserted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResources,
  postResources,
};
