const mongoose = require('mongoose');


mongoose.Promise = global.Promise;

const connect = async (DB_URL) => {
  mongoose.set('debug', false);
  return mongoose.connect(DB_URL || process.env.MONGO_URL);
}

const disconnect = async () => {
  return new Promise((resolve, reject) => {
    mongoose.connection.close(_ => resolve());
  })
}

module.exports = { connect, disconnect };
