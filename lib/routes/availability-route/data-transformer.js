// core node modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { buildMomentFromTime, getTimeFromDate, invokeMomentForDate } = require('./date-transformer');

// simple list->object transformer
const transformListToObject = list => list.reduce((result, listItem) => ({ ...result, [listItem.id]: listItem }), {});

/**
 * Initiate timesLeft by resource (doctor/room) and the provided dates.
 *
 * @param {Object} resource         - Can be either Doctor or Room
 * @param {String} dateWithoutTime  - String representation of Date in YYYY-MM-DD format
 * @param {Number} dayOfWeek        - Day of week as number between 0-6
 * @returns {*}
 */
const initTimesLeftByResource = (resource, dateWithoutTime, dayOfWeek) =>
  Object.assign(resource, {
    timesLeft: {
      ...resource.timesLeft,
      [dateWithoutTime]: [resource.times[dayOfWeek].toObject()],
    },
  });

/**
 * It updates the timesLeft by resource and the consultation. As 'consultation' is also considered
 * a pre-calculated availability time slot, since once availability has been calculated
 * that room/doctor for the date can't be used again.
 *
 * @param {Object} resource    - Can be either Doctor or Room
 * @param {Object} dateConfig  - date configuration object, hold info on multiple date settings
 * @returns {*}
 */
const updateTimesLeftByResource = (resource, dateConfig) => {
  const {
    dateWithoutTime, beginTime: beginConsultation, endTime: endConsultation, dayOfWeek,
  } = dateConfig;

  // first, check if timesLeft is initialized. If not, initialize it to times[dayOfWeek]
  if (!(resource.timesLeft && resource.timesLeft[dateWithoutTime])) {
    initTimesLeftByResource(resource, dateWithoutTime, dayOfWeek);
  }

  const {
    timesLeft: { [dateWithoutTime]: resourceTimesLeft },
  } = resource;
  let foundIt = false;

  // find a consultation spot for all resources's timesLeft. As soon as the spot has been found,
  // don't perform any other calculation
  const updatedResources = resourceTimesLeft.map((resourceTimeLeft) => {
    const { begin, end } = resourceTimeLeft;
    // if consultation's begin comes after resource's end, we can't split this time slot
    // also, if we already found a time-slot for the consultation, don't perform any additional checks
    if (foundIt || buildMomentFromTime(beginConsultation).isAfter(buildMomentFromTime(end))) {
      return { begin, end };
    }

    foundIt = true;
    const newTime = [];

    // if begin consultation is the same as the resource's begin, ignore the update
    if (beginConsultation !== begin) {
      newTime.push({ begin, end: beginConsultation });
    }

    // if end consultation is the same as the resource's end, ignore the update
    if (endConsultation !== end) {
      newTime.push({ begin: endConsultation, end });
    }

    return newTime;
  });

  const flattenResult = _.flatten(updatedResources);

  // if we didn't receive new time slots, it means that we can't make any more consultations for this resource
  // and current date. Mark is as "booked"
  return Object.assign(resource, {
    timesLeft: {
      ...resource.timesLeft,
      [dateWithoutTime]: flattenResult.length ? flattenResult : 'booked',
    },
  });
};

/**
 * It perform multiple update for all resources (doctors, rooms) and for all consultations
 *
 * @param {Array} doctors         - A list of doctors
 * @param {Array} rooms           - A list of rooms
 * @param {Array} consultations   - A list of ...consultations
 * @returns {*}
 */
const updateTimesLeftByConsultations = ([doctors, rooms, consultations]) => {
  // transform array of doctors/rooms into objects so the search can be faster
  const transformedDoctors = transformListToObject(doctors);
  const transformedRooms = transformListToObject(rooms);

  // reduce the consultations to a list of updated doctors/rooms
  return consultations.reduce(
    (result, consultation) => {
      const {
        begin, end, doctorId, roomId,
      } = consultation;
      const { doctors: reducedDoctors, rooms: reducedRooms } = result;

      // since consultation can't be spread across multiple days, we only need begin or end date to
      // compile date without time and dayOfWeek
      const dateConfig = {
        dateWithoutTime: getTimeFromDate(begin, 'YYYY-MM-DD'),
        beginTime: getTimeFromDate(begin),
        endTime: getTimeFromDate(end),
        dayOfWeek: invokeMomentForDate(begin, 'day'),
      };

      const updatedDoctors = updateTimesLeftByResource(reducedDoctors[doctorId], dateConfig);
      const updatedRooms = updateTimesLeftByResource(reducedRooms[roomId], dateConfig);

      // update doctors/rooms by preserving all other doctors/rooms
      // and overriding existing one with new settings
      Object.assign(result, {
        doctors: {
          ...reducedDoctors,
          [doctorId]: updatedDoctors,
        },
        rooms: {
          ...reducedRooms,
          [roomId]: updatedRooms,
        },
      });

      return result;
    },
    { doctors: transformedDoctors, rooms: transformedRooms },
  );
};

/**
 * If showing Doctor/Room ids is not relevant, we can freely remove the duplicate time-slots and sort the result.
 * Otherwise just sort the result-set.
 *
 * @param {Array} availabilityList
 * @param {Boolean} showIds
 * @returns {Array}
 */
const removeDuplicatesAndSort = (availabilityList, showIds) => {
  const sortedAvailabilityList = availabilityList.sort((a, b) => a.begin - b.begin);
  return showIds ? sortedAvailabilityList : _.uniqWith(sortedAvailabilityList, _.isEqual);
};

module.exports = {
  initTimesLeftByResource,
  updateTimesLeftByResource,
  updateTimesLeftByConsultations,
  removeDuplicatesAndSort,
};
