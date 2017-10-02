const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  timestamp_sent: Date,
  timestamp_read: Date,
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
  body: {
    text: String,
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
