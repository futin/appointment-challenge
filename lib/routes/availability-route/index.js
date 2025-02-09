// core node modules

// 3rd party modules
const debug = require('debug');

// internal modules
const { loadAllData } = require('./data-loader');
const { updateTimesLeftByConsultations, removeDuplicatesAndSort } = require('./data-transformer');
const calculateAvailability = require('./calculate-availability');
const { getLimitedDatesWithDays, getAllDatesWithDays } = require('./date-transformer');
const { ing } = require('../../utils');
const {
  loggerNamespaces: { availabilityRouteNamespace },
} = require('../../config/constants');

const logger = debug(availabilityRouteNamespace);

const areInputsValid = ({ begin, end, duration }) =>
  begin
  && end
  && duration
  && (Date.parse(begin) && Date.parse(end) && (parseInt(duration, 10) || parseInt(duration, 10) > 0));

const getAvailability = async (req, res, next) => {
  const {
    query: {
      begin, end, duration, useAllDayEvent, showIds,
    },
  } = req;

  // simple input validation
  if (!areInputsValid({ begin, end, duration })) {
    res.send('One of the inputs is invalid.');
    return;
  }

  const consultationDuration = parseInt(duration, 10);

  // load all doctors, rooms and consultations per requested date
  const [error, allResources] = await ing(loadAllData({ begin, end }));

  if (error) {
    logger('Oops... something went wrong while loading all resources', error);
    next(error);
    return;
  }

  // compile date configuration, which will be used for calculating the availability
  const dateConfigs = useAllDayEvent === 'yes'
    ? getAllDatesWithDays({ begin, end })
    : getLimitedDatesWithDays({ begin, end });

  const updatedResources = updateTimesLeftByConsultations(allResources);

  const availabilityList = calculateAvailability(updatedResources, dateConfigs, consultationDuration, showIds);

  const sortedAvailabilityList = removeDuplicatesAndSort(availabilityList, showIds);

  logger('We got the final availability list:', sortedAvailabilityList);
  res.send(sortedAvailabilityList);
};

module.exports = {
  getAvailability,
};
