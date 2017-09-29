const express = require('express');
const accounts = require('./accounts');
const router = express.Router();

router.use('/', accounts);

module.exports = router;
