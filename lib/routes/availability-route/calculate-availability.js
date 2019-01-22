// core node modules

// 3rd party modules
const debug = require('debug');

// internal modules
const { loggerNamespaces: { calculateAvailabilityRouteNamespace } } = require('../../config/constants');
const compareUtil = require('./compare-util');
const dataTransformer = require('./data-transformer');
const dateTransformer = require('./date-transformer');

const logger = debug(calculateAvailabilityRouteNamespace);

const calculateAvailability = ({ doctors, rooms, consultations }, dateConfigs, consultDuration) => {

  // reduce all rooms by building final result
  return rooms.reduce((totalResults, room, i) => {
    logger('Loaded room %d', i);
    const { timesLeft: roomTimesLeft = {} } = room;

    // load all doctors for each room to verify the availability
    doctors.forEach((doctor, j) => {
      logger('Loaded doctor %d', j);
      const { timesLeft: doctorTimesLeft = {} } = doctor;

      dateConfigs.forEach((dateConfig) => {
        logger('Loaded date config %o', dateConfig);
        const { dayOfWeek, dateWithoutTime } = dateConfig;

        const { [dateWithoutTime]: doctorConsultationTL } = doctorTimesLeft;
        const { [dateWithoutTime]: roomConsultationTL } = roomTimesLeft;

        if (doctorConsultationTL === 'booked') {
          logger(' Doctor %s is unavailable for further booking. skipping availability', doctor.name);
          return;
        }

        if (roomConsultationTL === 'booked') {
          logger(' Room %s is unavailable for further booking. skipping availability', room.name);
          return;
        }

        if (!doctorConsultationTL) {
          // init "timesLeft" if it is the first time we are using this doctor
          Object.assign(doctor, {
            timesLeft: {
              [dateWithoutTime]: [doctor.times[dayOfWeek]],
            },
          });
        }

        if (!roomConsultationTL) {
          // init "timesLeft" if it is the first time we are using this room
          Object.assign(room, {
            timesLeft: {
              [dateWithoutTime]: [room.times[dayOfWeek]],
            },
          });
        }

        // let's find out if doctor or room can't be booked anymore,
        const isTimeValid = dateTransformer.validateTimesLeft(doctor, room, dateWithoutTime);
        // TODO: move the bloc below to .validateTimesLeft()
        // const doctorTimeIntervalSums = dateTransformer.compileTimeIntervalSums(doctor.timesLeft[dateWithoutTime]);
        // const roomTimeIntervalSums = dateTransformer.compileTimeIntervalSums(room.timesLeft[dateWithoutTime]);
        //
        // const atLeastOneDoctorIntervalAvailable = doctorTimeIntervalSums
        //   .some(timeInterval => consultDuration >= timeInterval);
        //
        // const atLeastOneRoomIntervalAvailable = roomTimeIntervalSums
        //   .some(timeInterval => consultDuration >= timeInterval);
        //
        // if (!atLeastOneDoctorIntervalAvailable) {
        //   Object.assign(doctor, {
        //     timesLeft: {
        //       [dateWithoutTime]: 'booked',
        //     },
        //   });
        //
        //   if (!atLeastOneRoomIntervalAvailable) {
        //     Object.assign(room, {
        //       timesLeft: {
        //         [dateWithoutTime]: 'booked',
        //       },
        //     });
        //   }
        //
        //   return;
        // }

        if (!isTimeValid) {
          logger(`Unable to provide available time since doctor or room does not have enough time.
          doctor's times left: %o, and room's times left: %o for duration %d`,
          doctor.timesLeft[dateWithoutTime], room.timesLeft[dateWithoutTime], consultDuration);
          return;
        }

        const validTimeIntervals = compareUtil
          .compileValidTimeInterval(doctor.timesLeft[dateWithoutTime], room.timesLeft[dateWithoutTime]);

        if (!validTimeIntervals) {
          logger(' Incompatible times between room time: %s and doctor time: %s. skipping availability',
            room.times[dayOfWeek], doctor.times[dayOfWeek]);
          return;
        }

        // time interval sum in minutes! represents total interval time for specific room/doctor combination
        const timeIntervalSums = dateTransformer.compileTimeIntervalSums(validTimeIntervals);

        // and calculate if we have at least one available slot
        const atLeastOneIntervalAvailable = timeIntervalSums.some(timeInterval => consultDuration >= timeInterval);

        if (!atLeastOneIntervalAvailable) {
          logger(` Doctor/room %s/%s is unavailable for further booking.
                   Time intervals: %o and requested consultation duration: %s. skipping availability`,
          doctor.name, room.name, validTimeIntervals.join(','), consultDuration);
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