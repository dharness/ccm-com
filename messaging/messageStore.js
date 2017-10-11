const Message = require('./../models/Message')

class MessageStore {
  persist(messageToSave) {
    messageToSave.key = [messageToSave.to, messageToSave.from].sort().join(':')
    const message = new Message(messageToSave)
    return message.save()
  }
}

module.exports = new MessageStore()