// core node modules

// 3rd party modules
const mongoose = require('mongoose');

// internal alias modules

// internal modules

const { Schema } = mongoose;

const TimesSchema = Schema({
  begin: String,
  end: String,
});

module.exports = TimesSchema;
