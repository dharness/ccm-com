const express = require('express');
const { passport } = require('./../config/passport');
const Account = require('./../models/Account');

const router = express.Router();

router.post('/accounts/signup', (req, res, next) => {
  passport.authenticate('local-signup', (err, user, info) => {
    if(err) { return res.status(err.status).send(err.message); }

    res.send({ token: req.token });
  })(req, res, next);
});

router.post('/accounts/login', passport.authenticate('local-login', { session: false }), (req, res) => {
  res.send({ token: req.token })
});

router.post('/account.search', (req, res) => {
  Account.find({}, (err, accounts) => {
    if (err) { return res.send(500); }
    if(!accounts) { return res.sendStatus(404); }
    return res.send(accounts.map(a => ({ username: a.username })));
  });
});

router.post('/account.info', (req, res) => {
  const { username } = req.body;
  Account.findOne({ username }, (err, account) => {
    if (err) { return res.send(500); }
    if(!account) { return res.sendStatus(404); }
    return res.send(account.toClient());
  });
});

router.post('/account.delete', (req, res) => {
  const { username } = req.body;
  Account.find({ username }).remove(err => {
    if (err) { return res.send(500); }
    return res.sendStatus(204);
  })
});

module.exports = router;
