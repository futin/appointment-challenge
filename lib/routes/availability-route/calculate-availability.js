// core node modules

// 3rd party modules
const debug = require('debug');
const _ = require('lodash');

// internal modules
const { loggerNamespaces: { calculateAvailabilityRouteNamespace } } = require('../../config/constants');
const compareUtil = require('./compare-util');
const dateTransformer = require('./date-transformer');

const logger = debug(calculateAvailabilityRouteNamespace);

const calculateAvailability = ({ doctors, rooms }, dateConfigs, consultDuration) =>
  _.reduce(rooms, (totalResults, room, i) => {
    logger('Loaded room %d', i);

    // load all doctors for each room to verify the availability
    _.forEach(doctors, (doctor, j) => {
      logger('Loaded doctor %d', j);

      dateConfigs.forEach((dateConfig) => {
        logger('Loaded date config %o', dateConfig);
        const { dayOfWeek, dateWithoutTime } = dateConfig;

        const { [dateWithoutTime]: doctorConsultationTL } = doctor.timesLeft;
        const { [dateWithoutTime]: roomConsultationTL } = room.timesLeft;

        if (doctorConsultationTL === 'booked') {
          logger(' Doctor %s is unavailable for further booking. skipping availability', doctor.name);
          return;
        }

        if (roomConsultationTL === 'booked') {
          logger(' Room %s is unavailable for further booking. skipping availability', room.name);
          return;
        }

        if (!doctorConsultationTL) {
          const workingHours = doctor.times[dayOfWeek];
          if (!workingHours) {
            logger('Doctor %s is not available for this time of the week %d. skipping availability',
              doctor.name, dayOfWeek);
            return;
          }
          // init "timesLeft" if it is the first time we are using this doctor
          Object.assign(doctor, {
            timesLeft: {
              [dateWithoutTime]: [doctor.times[dayOfWeek]],
            },
          });
        }

        if (!roomConsultationTL) {
          const workingHours = room.times[dayOfWeek];
          if (!workingHours) {
            logger('Room %s is not available for this time of the week %d. skipping availability',
              room.name, dayOfWeek);
            return;
          }

          // init "timesLeft" if it is the first time we are using this room
          Object.assign(room, {
            timesLeft: {
              [dateWithoutTime]: [room.times[dayOfWeek]],
            },
          });
        }

        // let's find out if doctor or room can't be booked anymore,
        const isTimePerResourceAvailable = dateTransformer
          .validateTimesLeft(doctor, room, dateWithoutTime, consultDuration);

        if (!isTimePerResourceAvailable) {
          logger(`Unable to provide available time since doctor or room does not have enough time.
          doctor's times left: %o, and room's times left: %o for duration %d`,
          doctor.timesLeft[dateWithoutTime], room.timesLeft[dateWithoutTime], consultDuration);
          return;
        }

        const availability = compareUtil
          .compileValidTimeInterval(doctor, room, dateConfig, consultDuration);

        if (!(availability && Array.isArray(availability))) {
          logger(' Incompatible times between room time: %s and doctor time: %s. skipping availability',
            room.times[dayOfWeek], doctor.times[dayOfWeek]);
          return;
        }

        totalResults.push(...availability);
      });
    });

    return totalResults;
  }, []);

module.exports = calculateAvailability;
