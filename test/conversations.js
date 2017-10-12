const { start, stop } = require('./../server.js')
const MongoClient = require('mongodb').MongoClient
const chai = require('chai')
const chaiHttp = require('chai-http')
const io = require('socket.io-client')
const expect = chai.expect


const TEST_PORT = 9092
const TEST_DB_URL = process.env.MONGO_URL_TEST
const API_URL = `http://localhost:${TEST_PORT}/api`
chai.use(chaiHttp)

function _createUsers(numUsers) {
  const promises = [];
  for(let i = 0; i < numUsers; i++) {
    const p = chai
      .request(API_URL)
      .post('/account.create')
      .type('application/json')
      .send({
        username: 'newuser_' + i,
        password: 'password'
      })
      .then(res => res.body)
    promises.push(p);
  }
  return Promise.all(promises)
}

describe('conversations', () => {

  before(done => {
    start(TEST_PORT, TEST_DB_URL).then(() => {
      MongoClient.connect(TEST_DB_URL, (err, _db) => {
        db = _db
        db.collection('accounts').remove({}, () => done())
      })
    })
  })

  after(done => {
    db.collection('accounts').remove({}, (err, success) => {
      db.collection('conversations').remove({}, (err, success) => {
        db.close()
        stop().then(_ => done())
      });
    })
  })

  describe('conversations.list', (done) => {
    afterEach(done => {
      db.collection('accounts').remove({}, (err, success) => {
        if (err) throw err
        db.collection('conversations').remove({}, (err, success) => {
          if (err) throw err
          done()
        })
      })
    })

    it('should return a 401 unauthorized if no token is provided', () => {
      chai.request(API_URL)
      .post('/conversations.list')
      .type('application/json')
      .end(function (err, res) {
        expect(err).not.to.be.null
        expect(res).to.have.status(401)
      })
    });

    it('should return an empty array if only 1 account has been created', (done) => {
      _createUsers(1).then(responses => {
        chai.request(API_URL)
        .post('/conversations.list')
        .type('application/json')
        .set('token', responses[0].token)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.conversations).to.be.an('array')
          expect(res.body.conversations.length).to.equal(0)
  
          db.collection('conversations').find({}).toArray((err, docs) => {
            expect(docs.length).to.equal(0)
            done()
          })
        })
      })
    })

    it('should return an array of n - 1 conversations if n accounts are created', (done) => {
      const n = 6;
      _createUsers(n).then(responses => {
        chai.request(API_URL)
        .post('/conversations.list')
        .type('application/json')
        .set('token', responses[0].token)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.conversations).to.be.an('array')
          expect(res.body.conversations.length).to.equal(n - 1)
          done()
        })
      })
    })

    it('conversations should contain a members field with 2 members', (done) => {
      _createUsers(2).then(responses => {
        chai.request(API_URL)
        .post('/conversations.list')
        .type('application/json')
        .set('token', responses[0].token)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          console.log(res.body.conversations)
          expect(res.body.conversations).to.be.an('array')
          expect(res.body.conversations.length).to.equal(1)
          expect(res.body.conversations[0].members.length).to.equal(2)
          done()
        })
      })
    })

  });  
});