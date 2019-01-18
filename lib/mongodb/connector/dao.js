// core modules

// 3rd party modules

// internal modules
const models = require('../models');

const execute = (modelName, methodName, ...args) => models[modelName][methodName](...args);

const updateMany = async (modelName, deleteFilter, dataToInsert) => {
  try {
    await execute(modelName, 'deleteMany', deleteFilter);
    await execute(modelName, 'insertMany', dataToInsert);

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const dao = {
  execute,
  updateMany,
};

module.exports = dao;
