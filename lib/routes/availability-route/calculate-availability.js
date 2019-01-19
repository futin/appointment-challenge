// core node modules

// 3rd party modules
const debug = require('debug');

// internal modules
const { loggerNamespaces: { calculateAvailabilityRouteNamespace } } = require('../../config/constants');
const compareUtil = require('./compare-util');
const dataTransformer = require('./data-transformer');

const logger = debug(calculateAvailabilityRouteNamespace);

const calculateAvailability = ({ doctors, rooms, consultations }, datesAndDays, consultDuration) => {
  // reduce all rooms by building final result
  return rooms.reduce((totalResults, room, i) => {
    logger('Loaded room %d', i);

    // load all doctors for each room to verify the availability
    doctors.forEach((doctor) => {

      datesAndDays.forEach((dateWithDays) => {
        // we need on
        const activeConsultations = dataTransformer.fetchActiveConsultations(
          consultations,
          room.id,
          doctor.id,
          dateWithDays.dayOfWeek,
        );

      });
    });

    return totalResults;
  }, []);
};

module.exports = calculateAvailability;