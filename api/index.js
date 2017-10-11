const express = require('express');
const router = express.Router();
const accounts = require('./accounts');
const { passport } = require('./../config/passport')
const authenticate = passport.authenticate('jwt-auth', { session: false });
const { listConversations } = require('./conversationsController')
const messageController = require('./messageController')


router.use('/', accounts);
router.post('/conversations.list', authenticate, listConversations);
router.post('/messages.list', authenticate, messageController.list);

module.exports = router;
