const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const messageSchema = new Schema({
  timestampSent: {
    type: Date,
    default: Date.now
  },
  key: {
    type: String,
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  data: {
    type: Object,
    required: true
  }
}, {
  versionKey: false
});

messageSchema.method('toClient', function() {
  let obj = this.toObject();

  obj.id = obj._id;
  delete obj._id;
  delete obj.password;

  return obj;
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
