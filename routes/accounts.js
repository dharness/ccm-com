const express = require('express');
const { passport } = require('./../config/passport');
const Account = require('./../models/Account');

const router = express.Router();

router.post('/signup', passport.authenticate('local-signup', { session: false }), (req, res) => {
  console.log(req.token);
  res.send({ token: req.token })
});

router.post('/login', passport.authenticate('local-login', { session: false }), (req, res) => {
  res.send({ token: req.token })
});

router.get('/:accountId', (req, res) => {
  const accountId = req.params.accountId;

  Account.findOne({ _id: accountId }, (err, account) => {
    if (err) { return res.send(500); }
    return res.send(account.toClient());
  });
});

module.exports = router;
