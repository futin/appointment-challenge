// core node modules

// 3rd party modules

// internal modules
const { postResources, getResources } = require('./resources-routes');
const { postConsultations, getConsultations } = require('./consultations-routes');
const { getAvailability } = require('./availability-route');

const setupRoutes = (app) => {
  app.get('/resources', getResources);
  app.post('/resources', postResources);

  app.get('/consultations', getConsultations);
  app.post('/consultations', postConsultations);

  app.get('/availability', getAvailability);
};

module.exports = setupRoutes;
