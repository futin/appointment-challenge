// core modules

// 3rd party modules

// internal alias modules

// List of namespaces used with debug module
const loggerNamespaces = {
  // App level namespace
  appNamespace: 'appointment-challenge:lib:app',
  mongodbSetupNamespace: 'appointment-challenge:lib:database:setup',
  availabilityRouteNamespace: 'appointment-challenge:lib:routes:availability-route',
  calculateAvailabilityRouteNamespace: 'appointment-challenge:lib:routes:availability-route:calculate-availability',
  compareUtilNamespace: 'appointment-challenge:lib:routes:availability-route:compare-util',
};

module.exports = {
  loggerNamespaces,
};
