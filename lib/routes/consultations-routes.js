// core node modules

// 3rd party modules
const moment = require('moment');

// internal modules
const { connector } = require('../mongodb');

const getConsultations = (req, res, next) => {
  // remove unnecessary fields
  const projection = { _id: 0, __v: 0 };

  return connector
    .execute('Consultation', 'find', {}, projection)
    .then(result => res.send({ consultations: result }))
    .catch(error => next(error));
};

const postConsultations = async (req, res, next) => {
  const {
    body: { consultations },
  } = req;

  const ids = consultations.map(consultation => consultation.id);
  const updatedConsultations = consultations.map(consultation => ({
    ...consultation,
    begin: moment.utc(consultation.begin),
    end: moment.utc(consultation.end),
  }));

  const consultationsFilter = { id: { $in: ids } };

  try {
    await connector.updateMany('Consultation', consultationsFilter, updatedConsultations);

    res.send({ status: 'Success', message: 'Doctors/Rooms injected' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConsultations,
  postConsultations,
};
