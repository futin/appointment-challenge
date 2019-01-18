// core modules

// 3rd party modules
const debug = require('debug');
const mongoose = require('mongoose');

// internal modules
const { loggerNamespaces: { mongodbSetupNamespace } } = require('../config/constants');
const { mongodbSetup: { url } } = require('../config/settings');
const { ing } = require('../utils');

const logger = debug(mongodbSetupNamespace);

const setupMongoose = async () => {
  logger('Connecting to MongoDB: ', url);

  const [error] = await ing(
    mongoose.connect(
      url,
      { useNewUrlParser: true },
    ),
  );

  if (error) {
    logger('Unable to connect to MongoDB ', error);
    process.exit();
  }

  logger('Connected to MongoDB!');

  mongoose.Promise = global.Promise;
};

module.exports = setupMongoose;
