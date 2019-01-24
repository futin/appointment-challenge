// core modules

// 3rd party modules
const debug = require('debug');
const mongoose = require('mongoose');

// internal modules
const {
  loggerNamespaces: { mongodbSetupNamespace },
} = require('../config/constants');
const {
  mongodbSetup: { localUrl, remoteUrl },
} = require('../config/settings');
const { ing } = require('../utils');

const logger = debug(mongodbSetupNamespace);

// use local mongodb or remote instance ?
const url = process.env.MONGO_MODE === 'remote' ? remoteUrl : localUrl;

const setupMongoose = async () => {
  logger('Connecting to MongoDB: ', remoteUrl);

  const [error] = await ing(mongoose.connect(url, { useNewUrlParser: true }));

  if (error) {
    logger('Unable to connect to MongoDB ', error);
    process.exit();
  }

  logger('Connected to MongoDB!');

  mongoose.Promise = global.Promise;
};

module.exports = setupMongoose;
