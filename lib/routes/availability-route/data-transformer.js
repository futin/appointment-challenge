// core node modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { buildMomentFromTime, getTimeFromDate, invokeMomentForDate } = require('./date-transformer');

const transformListToObject = list =>
  list.reduce((result, listItem) =>
    ({ ...result, [listItem.id]: listItem }), {});

const updateResource = (resource, dates) => {
  const {
    dateWithoutTime, beginTime: beginConsultation, endTime: endConsultation, dayOfWeek,
  } = dates;

  // first, check if timesLeft is initialized. If not, initialize it to times[daysOfWeek]
  if (!(resource.timesLeft && resource.timesLeft[dateWithoutTime])) {
    Object.assign(resource, {
      timesLeft: {
        [dateWithoutTime]: [resource.times[dayOfWeek]],
      },
    });
  }

  const { timesLeft: { [dateWithoutTime]: resourceTimesLeft } } = resource;
  let foundIt = false;
  const updatedResources = resourceTimesLeft.map((resourceTimeLeft) => {
    const { begin, end } = resourceTimeLeft;
    // if consultation's begin comes after resource's end, we can't split this time slot
    if (buildMomentFromTime(beginConsultation).isAfter(buildMomentFromTime(end)) || foundIt) {
      return resourceTimeLeft;
    }

    foundIt = true;
    const newTime = [];

    // if begin consultation is the same as the resource's begin, ignore the update
    if (beginConsultation !== begin) {
      newTime.push({ begin, end: beginConsultation });
    }

    if (endConsultation !== end) {
      newTime.push({ begin: endConsultation, end });
    }

    return newTime;
  });

  return Object.assign(resource, {
    timesLeft: {
      [dateWithoutTime]: _.flatten(updatedResources),
    },
  });
};

const updateTimesLeftByConsultations = ([doctors, rooms, consultations]) => {
  const transformedDoctors = transformListToObject(doctors);
  const transformedRooms = transformListToObject(rooms);

  return consultations.reduce((result, consultation) => {
    const {
      begin, end, doctorId, roomId,
    } = consultation;
    const { doctors: reducedDoctors, rooms: reducedRooms } = result;

    // since consultation can't be spread across multiple days, we only need begin or end date to
    // compile date without time and dayOfWeek
    const dates = {
      dateWithoutTime: getTimeFromDate(begin, 'YYYY-MM-DD'),
      beginTime: getTimeFromDate(begin),
      endTime: getTimeFromDate(end),
      dayOfWeek: invokeMomentForDate(begin, 'day'),
    };

    const updatedDoctors = updateResource(reducedDoctors[doctorId], dates);
    const updatedRooms = updateResource(reducedRooms[roomId], dates);

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
  }, { doctors: transformedDoctors, rooms: transformedRooms });
};

module.exports = {
  updateTimesLeftByConsultations,
};
