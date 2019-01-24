// core node modules

// 3rd party modules
const debug = require('debug');
const _ = require('lodash');

// internal modules
const {
  loggerNamespaces: { calculateAvailabilityRouteNamespace },
} = require('../../config/constants');
const { compileValidTimeInterval } = require('./compare-util');
const { validateTimesLeft } = require('./date-transformer');
const { initTimesLeftByResource } = require('./data-transformer');

const logger = debug(calculateAvailabilityRouteNamespace);

/**
 * Responsible for iterating over compiled date configurations, rooms and doctors. Every iteration has certain
 * validators which try to optimize the execution by skipping all unnecessary steps:
 *
 *  - when doctor/room is booked for particular date
 *  - when doctor/room is unavailable for particular dayOfWeek
 *  - when found time-slots for doctor/room are less then requested consult duration
 *
 * At the end, it returns reduced result as [{begin: Date, end: Date}, ...] array, where it is up to caller to
 * have some additional information within the result (doctor/room id for particular availability)
 *
 * @param {Object} doctors          - List of all doctors
 * @param {Object} rooms            - List of all rooms
 * @param {Array} dateConfigs       - List of date configurations
 * @param {Number} consultDuration  - Requested consult duration in minutes
 * @param {Boolean} showIds         - If 'yes', pass doctorId/roomId with every result
 * @returns {*}
 */
const calculateAvailability = ({ doctors, rooms }, dateConfigs, consultDuration, showIds) =>
  dateConfigs.reduce((totalResults, dateConfig) => {
    logger('Loaded date config %o', dateConfig);
    const { dayOfWeek, dateWithoutTime } = dateConfig;

    _.forEach(rooms, (room) => {
      logger('Loaded room %s', room.name);

      if (!room.times[dayOfWeek]) {
        logger('Room %s is not available for this time of the week %d. skipping availability', room.name, dayOfWeek);
        return;
      }

      // load all doctors for each room to verify the availability
      _.forEach(doctors, (doctor) => {
        logger('Loaded doctor %s', doctor.name);

        if (!doctor.times[dayOfWeek]) {
          logger(
            'Doctor %s is not available for this time of the week %d. skipping availability',
            doctor.name,
            dayOfWeek,
          );
          return;
        }
        const { timesLeft: { [dateWithoutTime]: roomConsultationTL } = {} } = room;
        const { timesLeft: { [dateWithoutTime]: doctorConsultationTL } = {} } = doctor;

        if (doctorConsultationTL === 'booked' || roomConsultationTL === 'booked') {
          logger(
            ' Doctor/Room %s/%s is unavailable for further booking. skipping availability',
            doctor.name,
            room.name,
          );
          return;
        }

        if (!roomConsultationTL) {
          // init "timesLeft" if it is the first time we are using this room
          initTimesLeftByResource(room, dateWithoutTime, dayOfWeek);
        }

        if (!doctorConsultationTL) {
          // init "timesLeft" if it is the first time we are using this doctor
          initTimesLeftByResource(doctor, dateWithoutTime, dayOfWeek);
        }

        // let's find out if doctor or room can't be booked anymore,
        const isTimePerResourceAvailable = validateTimesLeft(doctor, room, dateWithoutTime, consultDuration);

        if (!isTimePerResourceAvailable) {
          logger(
            `Unable to provide available time since doctor or room does not have enough time.
          doctor's times left: %o, and room's times left: %o for duration %d`,
            doctor.timesLeft[dateWithoutTime],
            room.timesLeft[dateWithoutTime],
            consultDuration,
          );
          return;
        }

        const availabilityList = compileValidTimeInterval(doctor, room, dateConfig, consultDuration, showIds);

        if (!(availabilityList && Array.isArray(availabilityList))) {
          logger(
            ' Incompatible times between room time: %s and doctor time: %s. skipping availability',
            room.times[dayOfWeek],
            doctor.times[dayOfWeek],
          );
          return;
        }

        totalResults.push(...availabilityList);
      });
    });

    return totalResults;
  }, []);

module.exports = calculateAvailability;
