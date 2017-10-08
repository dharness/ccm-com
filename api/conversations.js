const express = require('express')
const router = express.Router()
const Conversation = require('./../models/Conversation')
const { passport } = require('./../config/passport')
const authenticate = passport.authenticate('jwt-auth', { session: false });
const { list } = require('./conversationsController')

router.post('/conversations.list', authenticate, list);

module.exports = router