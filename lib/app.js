// node core modules
const http = require('http');

// 3rd party modules
const express = require('express');
const bodyParser = require('body-parser');
const debug = require('debug');

// internal modules
const setupRoutes = require('./routes');
const { setup: setupMongoose } = require('./mongodb');
const { serverSetup } = require('./config/settings');
const {
  loggerNamespaces: { appNamespace },
} = require('./config/constants');

const logger = debug(appNamespace);

const baseConfiguration = (app) => {
  logger('Setting up the base server configuration');
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
};

const initServer = (app) => {
  const { host, port } = serverSetup;
  const server = http.createServer(app);

  server.listen(port, host, () => {
    console.log(`Server listening at http://${host}:${port}`); // eslint-disable-line no-console
  });
};

// App configuration and server initialization
(async () => {
  const app = express();

  await setupMongoose();
  baseConfiguration(app);
  setupRoutes(app);

  initServer(app);
})();
