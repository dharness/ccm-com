const express = require('express');
const router = express.Router();
const accounts = require('./accounts');
const { passport } = require('./../config/passport')
const authenticate = passport.authenticate('jwt-auth', { session: false });
const { list } = require('./conversationsController')


router.use('/', accounts);
router.post('/conversations.list', authenticate, list);

module.exports = router;
