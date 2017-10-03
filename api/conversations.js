const express = require('express')
const router = express.Router()
const Conversation = require('./../models/Conversation')
const { passport } = require('./../config/passport')
const authenticate = passport.authenticate('jwt-auth', { session: false });

router.post('/conversations.list', authenticate, (req, res) => {
  const { id } = req.user;
  Conversation.find({ 
    members: id
   }, (err, convos) => {
    if (err) { return res.send(500); }
    if (!convos) { return res.sendStatus(404); }
    return res.send({
      conversations: convos.map(convo => convo.toClient())
    })
  })
});

router.post('/conversations.create', authenticate, (req, res) => {
  const { id } = req.user;
  const { members } = req.body;
  console.log(id)
  if(!members.includes(id)) {
    return res.sendStatus(309);
  }
  const conversation = new Conversation({ members });
  conversation.save(err => {
    if(err) { return res.send(err) }
    res.send(200);
  })
});

module.exports = router