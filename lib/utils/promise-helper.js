// core node modules

// 3rd party modules

// internal alias modules

// internal modules

/**
 * Helper function for async / await logic. This can be used
 * instead of try / catch flow.
 *
 * e.x.
 *      const [error, awaitedPromise] = await to(new Promise());
 *
 * @param promise
 * @return {Promise<any[]|T>}
 */
const ing = promise => promise.then(data => [null, data]).catch(error => [error]);

module.exports = {
  ing,
};
