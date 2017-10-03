const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }]
}, {
  versionKey: false
});

conversationSchema.method('toClient', function() {
  let obj = this.toObject();

  obj.id = obj._id;
  delete obj._id;
  delete obj.password;

  return obj;
});

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
