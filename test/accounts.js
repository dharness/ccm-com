const { start, stop } = require('./../server.js')
const chai = require('chai')
const chaiHttp = require('chai-http')
const io = require('socket.io-client')
const MongoClient = require('mongodb').MongoClient
const expect = chai.expect
const jwtSecretKey = require('./../config/jwt').secretKey;
const jwt = require('jsonwebtoken')

const TEST_PORT = 9092
const TEST_DB_URL = process.env.MONGO_URL_TEST
const API_URL = `http://localhost:${TEST_PORT}/api`
chai.use(chaiHttp)

describe('/accounts', () => {
  var db

  before(done => {
    start(TEST_PORT, TEST_DB_URL).then(() => {
      MongoClient.connect(TEST_DB_URL, (err, _db) => {
        db = _db
        db.collection('accounts').drop(() => done())
      })
    })
  })

  after(done => {
    db.collection('accounts').drop((err, success) => {
      db.close()
      stop().then(_ => done())
    })
  })

  it('should not contain any accounts', (done) => {
    db.collection('accounts').find({}).toArray((err, docs) => {
      expect(docs.length).to.equal(0)
      done()
    })
  })

  describe('accounts.create', () => {

    afterEach((done) => {
      db.collection('accounts').drop(function (err, success) {
        if (err) throw err
        done()
      })
    })

    it('should create a new account', (done) => {
      chai.request(API_URL)
        .post('/accounts.create')
        .type('application/json')
        .send({
          username: 'newuser',
          password: 'password'
        })
        .end(function (err, res) {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.token).to.be.a('string')
          db.collection('accounts').find({}).toArray((err, docs) => {
            expect(docs.length).to.equal(1)
            expect(docs[0].username).to.equal('newuser')
            expect(docs[0].username).to.equal('newuser')
            done()
          })
        })
    })

    it('should not create a new account if the username is taken', (done) => {
      db.collection('accounts').insert({
        username: 'newuser',
        password: 'somehash'
      }, (err, { result }) => {
        expect(result.ok).to.equal(1)
        chai.request(API_URL)
          .post('/accounts.create')
          .type('application/json')
          .send({
            username: 'newuser',
            password: 'password'
          })
          .end((err, res) => {
            expect(err).not.to.be.null
            expect(err.text).not.to.equal('username already exists')
            expect(res).to.have.status(409)
            db.collection('accounts').find({}).toArray((err, docs) => {
              expect(docs.length).to.equal(1)
              expect(docs[0].username).to.equal('newuser')
              expect(docs[0].username).to.equal('newuser')
              done()
            })
          })
      })
    })
  })

  describe('/login', () => {
    before(done => {
      chai.request(API_URL)
        .post('/accounts.create')
        .type('application/json')
        .send({
          username: 'newuser',
          password: 'password'
        })
        .end((err, res) => {
          expect(err).to.be.null
          done()
        })
    })

    after((done) => {
      db.collection('accounts').drop(function (err, success) {
        if (err) throw err
        done()
      })
    })

    it('should return a token with valid login', (done) => {
      chai.request(API_URL)
        .post('/accounts.login')
        .type('application/json')
        .send({
          username: 'newuser',
          password: 'password'
        })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.token).to.be.a('string')
          done()
        })
    })

    it('should reject invalid username login', (done) => {
      chai.request(API_URL)
        .post('/accounts.login')
        .type('application/json')
        .send({
          username: 'badusername',
          password: 'password'
        })
        .end((err, res) => {
          expect(err).not.to.be.null
          expect(res).to.have.status(401)
          done()
        })
    })

    it('should reject invalid password login', (done) => {
      chai.request(API_URL)
        .post('/accounts.login')
        .type('application/json')
        .send({
          username: 'newuser',
          password: 'badpassword'
        })
        .end((err, res) => {
          expect(err).not.to.be.null
          expect(res).to.have.status(401)
          done()
        })
    })
  })

  describe('accounts.search', () => {
    var token;

    before(done => {
      chai.request(API_URL)
        .post('/accounts.create')
        .type('application/json')
        .send({
          username: 'user1',
          password: 'password'
        })
        .end((err, res) => {
          expect(err).to.be.null
          token = res.body.token;
          db.collection('accounts').insertMany([
            { username: 'user2' }
          ], (err, res) => {
            expect(err).to.be.null
            done()
          })
        })
    })

    after(done => {
      db.collection('accounts').drop((err, success) => {
        if (err) throw err
        done()
      })
    })

    it('should return an array of accounts', (done) => {
      chai.request(API_URL)
        .post('/account.search')
        .type('application/json')
        .set('token', token)
        .send({})
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.accounts).to.be.an('array')
          expect(res.body.accounts.length).to.equal(2)
          done();
        })
    })

    it('should return an array containing matching accounts by username', (done) => {
      chai.request(API_URL)
        .post('/account.search')
        .set('token', token)
        .type('application/json')
        .send({
          username: 'er1'
        })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.accounts).to.be.an('array')
          expect(res.body.accounts.length).to.equal(1)
          expect(res.body.accounts[0].username).to.equal('user1')
          done();
        })
    })

    it('should return an empty array if no matches found', (done) => {
      chai.request(API_URL)
        .post('/account.search')
        .set('token', token)
        .type('application/json')
        .send({
          username: 'notaname'
        })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.accounts).to.be.an('array')
          expect(res.body.accounts.length).to.equal(0)
          done();
        })
    })

    it('should return 401 unauthorized if no token is present', (done) => {
      chai.request(API_URL)
        .post('/account.search')
        .type('application/json')
        .send({})
        .end((err, res) => {
          expect(err).not.to.be.null
          expect(res).to.have.status(401)
          done();
        })
    })
  })

  describe('accounts.delete', () => {
    let token;

    beforeEach(done => {
      chai.request(API_URL)
        .post('/accounts.create')
        .type('application/json')
        .send({
          username: 'user1',
          password: 'password'
        })
        .end((err, res) => {
          expect(err).to.be.null
          token = res.body.token;
          done()
        })
    })

    afterEach(done => {
      db.collection('accounts').drop((err, success) => {
        done()
      })
    })

    it('should remove an account if it exists', done => {
      chai.request(API_URL)
      .post('/account.delete')
      .type('application/json')
      .set('token', token)
      .send({
        username: 'user1'
      })
      .end((err, res) => {
        expect(err).to.be.null
        expect(res).to.have.status(204)
        db.collection('accounts').find({}).toArray((err, docs) => {
          expect(docs.length).to.equal(0)
          done()
        })
      })      
    });

    it('should not remove the account if the token is missing', done => {
      chai.request(API_URL)
      .post('/account.delete')
      .type('application/json')
      .send({
        username: 'user1'
      })
      .end((err, res) => {
        expect(err).not.to.be.null
        expect(res).to.have.status(401)
        db.collection('accounts').find({}).toArray((err, docs) => {
          expect(docs.length).to.equal(1)
          done()
        })
      })      
    });

    it('should not remove the account if the token is invalid', done => {
      chai.request(API_URL)
      .post('/account.delete')
      .type('application/json')
      .set('token', 'im a big fat idiot')
      .send({
        username: 'user1'
      })
      .end((err, res) => {
        expect(err).not.to.be.null
        expect(res).to.have.status(401)
        db.collection('accounts').find({}).toArray((err, docs) => {
          expect(docs.length).to.equal(1)
          done()
        })
      })      
    });

    it('should not remove the account if the token belongs to another user', done => {
      chai.request(API_URL)
      .post('/accounts.create')
      .type('application/json')
      .send({
        username: 'user2',
        password: 'password'
      })
      .end((err, res) => {
        const fakeToken = jwt.sign(
          { username: 'user2' },
          jwtSecretKey,
          { expiresIn: '1h' }
        )
        chai.request(API_URL)
        .post('/account.delete')
        .type('application/json')
        .set('token', fakeToken)
        .send({
          username: 'user1'
        })
        .end((err, res) => {
          expect(err).not.to.be.null
          expect(res).to.have.status(401)
          db.collection('accounts').find({}).toArray((err, docs) => {
            expect(docs.length).to.equal(2)
            done()
          })
        }) 
      }) 
    });
  })

})
