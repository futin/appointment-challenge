// core modules

// 3rd party modules

// internal alias modules

const mongodbSetup = {
  localUrl: 'mongodb://localhost/appointment-challenge',
  // this is for testing purposes only, and while project is private.
  // Exposing publicly username/password of any kind is wrong on so many levels!
  remoteUrl: 'mongodb://admin:admin1234@ds111455.mlab.com:11455/appointment-challenge',
};

const serverSetup = {
  host: 'localhost',
  port: '3000',
};

module.exports = {
  mongodbSetup,
  serverSetup,
};
