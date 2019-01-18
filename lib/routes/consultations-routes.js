// core node modules

// 3rd party modules

// internal modules
const { connector } = require('../mongodb');

const getConsultations = (req, res, next) => {
  // remove unnecessary fields
  const projection = { _id: 0, __v: 0 };

  return connector.execute('Consultation', 'find', {}, projection)
    .then(result => res.send({ consultations: result }))
    .catch(error => next(error));
};

const postConsultations = async (req, res, next) => {
  const { body: { consultations } } = req;

  const consultationsFilter = { id: { $in: consultations.map(d => d.id) } };

  try {
    await connector.updateMany('Consultation', consultationsFilter, consultations);

    res.send('Doctors/Rooms injected');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConsultations,
  postConsultations,
};
