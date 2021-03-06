const Conversation = require('./../models/Conversation')
const { ObjectId } = require('mongoose').Types

const createConversations = (newAccountId, accounts) => {
  const promises = []
  return Conversation.find({}, 'key').then(keys => {

    accounts.forEach(({ id: accountId }) => {
      if (accountId !== newAccountId) {
        const members = [accountId, newAccountId].sort()
        const key = members.join(':')

        if (!keys.includes(key)) {
          const query = { key }
          const update = { members, key }
          const options = { upsert: true, new: true };
          const conversation = new Conversation({ members, key })
          const p = conversation.save().catch(err => {
            if (err.code !== 11000) {
              throw err;
            }
          })
          promises.push(p)
        }
      }
    })
    return Promise.all(promises)
  })
}

const listConversations = (req, res) => {
  const { id } = req.user;
  Conversation.aggregate([
    {
      $match: { members: ObjectId(id)}
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'key',
        foreignField: 'key',
        as: 'messages'
      }
    }
  ], (err, convos) => {
    if (err) { return res.send(500); }
    if (!convos) { return res.sendStatus(404); }
    return res.send({
      conversations: convos.map(convo => {
        convo.id = convo._id;
        delete convo._id;
        return convo;
      })
    })
  })
}

module.exports = {
  listConversations,
  createConversations
}