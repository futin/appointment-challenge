// core node modules

// 3rd party modules
const debug = require('debug');

// internal modules
const dataLoader = require('./data-loader');
const { updateTimesLeftByConsultations } = require('./data-transformer');
const calculateAvailability = require('./calculate-availability');
const { ing } = require('../../utils');
const { loggerNamespaces: { availabilityRouteNamespace } } = require('../../config/constants');
const dateTransformer = require('./date-transformer');

const logger = debug(availabilityRouteNamespace);

const areInputsValid = ({ begin, end, duration }) =>
  (begin && end && duration)
  && (Date.parse(begin) && Date.parse(end)
    && (parseInt(duration, 10) || parseInt(duration, 10) > 0));

const getAvailability = async (req, res, next) => {
  const { query: { begin, end, duration } } = req;

  // simple input validation
  if (!areInputsValid({ begin, end, duration })) {
    res.send('One of the inputs is invalid.');
    return;
  }

  const consultationDuration = parseInt(duration, 10);

  // load all doctors, rooms and consultations per requested date
  const [error, allResources] = await ing(dataLoader.loadAll({ begin, end }));

  if (error) {
    logger('Oops... something went wrong while loading all resources', error);
    next(error);
    return;
  }

  const datesAndDays = dateTransformer.getAllDatesWithDays({ begin, end });

  const updatedResources = updateTimesLeftByConsultations(allResources);

  const availabilityList = calculateAvailability(updatedResources, datesAndDays, consultationDuration);

  const sortedAvailabilityList = availabilityList.sort((a, b) => a.begin - b.begin);

  logger('We got the final availability list:', sortedAvailabilityList);
  res.send(sortedAvailabilityList);
};

module.exports = {
  getAvailability,
};
