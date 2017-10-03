const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const Account = require('./../models/Account')
const jwt = require('jsonwebtoken')
const jwtConfig = require('./jwt')
const passportJWT = require('passport-jwt')

function configureStrategies () {
  passport.serializeUser((account, done) => {
    done(null, account.id)
  })

  passport.deserializeUser((id, done) => {
    Account.findById(id, (err, account) => {
      done(err, account)
    })
  })

  passport.use('local-signup',
    new LocalStrategy({ passReqToCallback: true },
      (req, username, password, done) => {
        Account.findOne({ username}, (err, account) => {
          if (err) { return done(err) }

          if (account) {
            return done({
              status: 409,
              message: 'username already exists'
            }, false, req)
          }

          const newAccount = new Account()
          newAccount.username = username
          newAccount.password = newAccount.generateHash(password)

          newAccount.save((err) => {
            if (err) { throw err; }

            req.token = jwt.sign(
              { username},
              jwtConfig.secretKey,
              { expiresIn: jwtConfig.expiresIn }
            )

            return done(null, newAccount, req)
          })
        })
      }))

  passport.use('local-login',
    new LocalStrategy({ passReqToCallback: true },
      (req, username, password, done) => {
        Account.findOne({ username}, (err, account) => {
          if (err) { return done(err); }

          if (!account) { return done(null, false, req); }
          if (!account.validPassword(password)) { return done(null, false, req); }
          req.token = jwt.sign(
            { username},
            jwtConfig.secretKey,
            { expiresIn: jwtConfig.expiresIn }
          )

          return done(null, account, req)
        })
      }))

  var jwtOptions = {
    jwtFromRequest: passportJWT.ExtractJwt.fromHeader('token'),
    secretOrKey: jwtConfig.secretKey
  }
  passport.use('jwt-auth', new passportJWT.Strategy(jwtOptions, (jwt_payload, next) => {
    const { username } = jwt_payload;

    Account.findOne({ username }, (err, account) => {
      if (err) { return next(err, false) }
      if (!account) { return next(404, false) }
      return next(null, account)
    });
  }))
  return passport
}

module.exports = { configureStrategies, passport}
