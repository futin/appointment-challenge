// core node modules

// 3rd party modules
const debug = require('debug');

// internal modules
const { loggerNamespaces: { calculateAvailabilityRouteNamespace } } = require('../../config/constants');
const compareUtil = require('./compare-util');
const dataTransformer = require('./data-transformer');

const logger = debug(calculateAvailabilityRouteNamespace);

const calculateAvailability = ({ doctors, rooms, consultations }, dateConfigs, consultDuration) => {

  // reduce all rooms by building final result
  return rooms.reduce((totalResults, room, i) => {
    logger('Loaded room %d', i);

    // load all doctors for each room to verify the availability
    doctors.forEach((doctor, j) => {
      logger('Loaded doctor %d', j);
      const { timesLeft = {} } = doctor;

      dateConfigs.forEach((dateConfig) => {
        logger('Loaded date config %o', dateConfig);
        const { dayOfWeek, dateWithoutTime } = dateConfig;

        const { [dateWithoutTime]: doctorConsultationTL } = timesLeft;

        if (doctorConsultationTL === 'booked') {
          logger(' Doctor %s is unavailable for further booking. skipping availability', doctor.name);
          return;
        }

        const validTimeInterval = compareUtil.compileValidTimeInterval(room.times[dayOfWeek], doctor.times[dayOfWeek]);

        if (!validTimeInterval) {
          logger(' Incompatible times between room time: %s and doctor time: %s. skipping availability',
            room.times[dayOfWeek], doctor.times[dayOfWeek]);
          return;
        }

        // time interval sum in minutes! represents total interval time for specific room/doctor combination
        const timeIntervalSum = compareUtil.compileTimeIntervalSum(validTimeInterval);

        // init "timesLeft" if it is the first time we are using this doctor
        if (!doctorConsultationTL) {
          Object.assign(doctor, {
            timesLeft: {
              [dateWithoutTime]: [timeIntervalSum],
            },
          });
        }

        // get consultation timesLeft array
        const { [dateWithoutTime]: updatedDoctorsTL } = doctor.timesLeft;

        // and calculate if we have at least one available slot
        const atLeastOneIntervalAvailable = updatedDoctorsTL.some(consInterval => consultDuration >= consInterval);

        if (!atLeastOneIntervalAvailable) {
          logger(` Doctor %s is unavailable for further booking.
                   His time interval: %o and requested consultation duration: %s`,
          doctor.name, updatedDoctorsTL, consultDuration);

          // since the same request is going to be asked for this doctor for every room,
          // make sure to notify other rooms and exit early as possible
          Object.assign(doctor, {
            timesLeft: {
              [dateWithoutTime]: 'booked',
            },
          });
          return;
        }
        // // we need on
        // const activeConsultations = dataTransformer.fetchActiveConsultations(
        //   consultations,
        //   room.id,
        //   doctor.id,
        //   dateWithDays.dateWithoutTime,
        // );
      });
    });

    return totalResults;
  }, []);
};

module.exports = calculateAvailability;