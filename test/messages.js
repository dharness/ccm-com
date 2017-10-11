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

describe('messages', () => {

  before(done => {
    start(TEST_PORT, TEST_DB_URL).then(() => {
      MongoClient.connect(TEST_DB_URL, (err, _db) => {
        db = _db
        db.collection('messages').remove({}, () => done())
      })
    })
  })

  after(done => {
    db.collection('accounts').remove({}, (err, success) => {
      db.collection('conversations').remove({}, (err, success) => {
        db.collection('messages').remove({}, (err, success) => {
          db.close()
          stop().then(_ => done())
        })
      })
    })
  })

  describe('messages.list', (done) => {
    afterEach(done => {
      db.collection('accounts').remove({}, (err, success) => {
        db.collection('conversations').remove({}, (err, success) => {
          db.collection('messages').remove({}, (err, success) => {
            done()
          })
        })
      })
    })

    it('should return a 401 unauthorized if no token is provided', done => {
      chai.request(API_URL)
      .post('/messages.list')
      .type('application/json')
      .end((err, res) => {
        expect(err).not.to.be.null
        expect(res).to.have.status(401)
        done()
      })
    });

    it('should return a 400 if the request does not include a key', done => {
      _createUsers(1).then(tokens => {
        const { token } = tokens[0]
        chai.request(API_URL)
        .post('/messages.list')
        .set('token', token)
        .type('application/json')
        .end((err, res) => {
          expect(err).not.to.be.null
          expect(res).to.have.status(400)
          done()
        })
      })
    });

    it('should return all messages matching the key', done => {
      db.collection('messages').insertMany([
        { key: 'key1', data: 'data1' },
        { key: 'key2', data: 'data2' },
      ], () => {
        _createUsers(1).then(tokens => {
          const { token } = tokens[0]

          chai.request(API_URL)
          .post('/messages.list')
          .set('token', token)
          .send({ key: 'key1' })
          .type('application/json')
          .end((err, res) => {
            expect(res.body.messages.length).to.equal(1)
            expect(res.body.messages[0].key).to.equal('key1')
            done()
          })
        })
      })
    });
  });
});