const conn = new Mongo();

const timifyDb = conn.getDB('appointment-challenge');

print(`dropping database ${timifyDb}`);

timifyDb.dropDatabase();
