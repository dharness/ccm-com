const express = require('express');
const router = express.Router();
const accounts = require('./accounts');
const { passport } = require('./../config/passport')
const authenticate = passport.authenticate('jwt-auth', { session: false });
const { listConversations } = require('./conversationsController')


router.use('/', accounts);
router.post('/conversations.list', authenticate, listConversations);

module.exports = router;
