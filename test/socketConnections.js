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
const SERVER_URL = `http://localhost:${TEST_PORT}`
const TEST_DB_URL = process.env.MONGO_URL_TEST

function createAccount ({ username }) {
  return new Promise((resolve, reject) => {
    chai.request(SERVER_URL)
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

describe('socket connections', () => {
  var token, db;

  before(done => {
    start(TEST_PORT, TEST_DB_URL).then(() => {
      createAccount({ username: 'some_username' }).then(_token => {
        token = _token;
        MongoClient.connect(TEST_DB_URL, (err, _db) => {
          if(err) { return console.log(err); }
          db = _db
          done();
        })
      })
    })
  })

  after(done => {
    db.collection('accounts').drop((err, success) => {
      db.close()
      stop().then(_ => done());
    })
  })

  it('should connect if a valid JWT is provided', done => {
    const options = { headers: { token } };
    const connection = new WebSocket(SOCKET_URL, options);

    connection.onopen = (error) => {
      expect(error).not.to.be.null;
      done();
    };
  })

  it('should not connect if a valid JWT is not provided', done => {
    const connection = new WebSocket(SOCKET_URL);
    connection.onerror = (error) => {
      expect(error).not.to.be.null;
      done();
    };
  })

  it('should not connect if a valid JWT is not provided', done => {
    const options = { headers: { token: 'NOT A REAL TOKEN' } };
    const connection = new WebSocket(SOCKET_URL, options);
    connection.onerror = (error) => {
      expect(error).not.to.be.null;
      done();
    };
  })
})
