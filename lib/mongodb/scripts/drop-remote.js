// this is for testing purposes only, and while project is private.
// Exposing publicly username/password of any kind is wrong on so many levels!
const conn = new Mongo('mongodb://admin:admin1234@ds111455.mlab.com:11455/appointment-challenge');

const timifyDb = conn.getDB('appointment-challenge');

print(`dropping database ${timifyDb}`);

timifyDb.dropDatabase();
