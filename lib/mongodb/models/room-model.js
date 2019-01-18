// core node modules

// 3rd party modules
const mongoose = require('mongoose');

// internal modules
const Times = require('./times-schema');

const { Schema } = mongoose;

const RoomSchema = Schema({
  id: String,
  name: String,
  times: [Times],
});

module.exports = mongoose.model('Room', RoomSchema);
