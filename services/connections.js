const mongoose = require('mongoose');


mongoose.Promise = global.Promise;

const connect = async () => {
  mongoose.set('debug', false);
  return mongoose.connect(process.env.MONGO_URL);
}

module.exports = { connect };
