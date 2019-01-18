// core modules

// 3rd party modules
const mongoose = require('mongoose');

// internal alias modules

// internal modules

const mongodbIdBuilder = id => mongoose.Types.ObjectId(id);

module.exports = {
  mongodbIdBuilder,
};
