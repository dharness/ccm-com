const express = require('express');
const accounts = require('./accounts');
const conversations = require('./conversations');
const router = express.Router();

router.use('/', accounts);
router.use('/', conversations);

module.exports = router;
