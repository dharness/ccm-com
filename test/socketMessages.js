const { start, stop } = require('./../server.js')
const WebSocket = require('ws')
const chai = require('chai')
const chaiHttp = require('chai-http')
const spies = require('chai-spies');
const MongoClient = require('mongodb').MongoClient
const expect = chai.expect
chai.use(spies);

const TEST_PORT = 9092
const SOCKET_URL = `ws://localhost:${TEST_PORT}`
const API_URL = `http://localhost:${TEST_PORT}/api`
const TEST_DB_URL = process.env.MONGO_URL_TEST

function createAccount ({ username }) {
  return new Promise((resolve, reject) => {
    chai.request(API_URL)
      .post('/accounts/signup')
      .type('application/json')
      .send({
        username,
        password: 'password'
      })
      .end((err, res) => {
        if (err) { return reject(err); }
        resolve(res.body.token)
      })
  })
}

function connectHelper(options) {
  return new Promise((resolve, reject) => {
    const client = new WebSocket(SOCKET_URL, options);
    client.onopen = _ => resolve(client);
    client.onerror = err => reject(err);
  })
}

describe('socket messages', () => {
  var client1, client2, token1, token2, db;

  before(done => {
    start(TEST_PORT, TEST_DB_URL).then(() => {
      Promise.all([
        createAccount({ username: 'user1' }),
        createAccount({ username: 'user2' }),
      ]).then(tokens => {
        token1 = tokens[0];
        token2 = tokens[1];
        MongoClient.connect(TEST_DB_URL, (err, _db) => {
          db = _db
          done()
        })
      })
    })
  })

  after(done => {
    db.collection('accounts').drop((err, success) => {
      db.close()
      stop().then(_ => done())
    })
  })

  beforeEach(done => {
    const options1 = { headers: { token: token1 } };
    const options2 = { headers: { token: token2 } };
    Promise.all([
      connectHelper(options1),
      connectHelper(options2)
    ]).then(clients => {
      client1 = clients[0]
      client2 = clients[1]
      done()
    })
  })

  it('should send a message between users', (done) => {
    const messageToSend = JSON.stringify({
      from: 'user1',
      to: 'user2',
      data: {
        type: 'text',
        body: 'simple text'
      }
    })

    client2.onmessage = e => {
      expect(e.data).to.equal(messageToSend)
      done()
    };
    client1.send(messageToSend)
  })
})
