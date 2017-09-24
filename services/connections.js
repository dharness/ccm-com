const mongoose = require('mongoose');


mongoose.Promise = global.Promise;

const connect = async (DB_URL) => {
  mongoose.set('debug', false);
  return mongoose.connect(DB_URL || process.env.MONGO_URL);
}

module.exports = { connect };
