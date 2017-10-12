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

function createAccount ({ username }) {
  return new Promise((resolve, reject) => {
    chai.request(API_URL)
      .post('/account.create')
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

function connectHelper(token) {
  return new Promise((resolve, reject) => {
    const client = new WebSocket(`${SOCKET_URL}?token=${token}`);
    client.onopen = _ => resolve(client);
    client.onerror = err => reject(err);
  })
}

describe('socket messages', () => {
  var id1, id2, client1, client2, token1, token2, db;

  before(done => {
    start(TEST_PORT, TEST_DB_URL).then(() => {
      return _createUsers(2).then(responses => {
        token1 = responses[0].token;
        token2 = responses[1].token;
        id1 = responses[0].account.id;
        id2 = responses[1].account.id;
        MongoClient.connect(TEST_DB_URL, (err, _db) => {
          db = _db
          done()
        })
      })
    })
  })

  after(done => {
    db.collection('accounts').remove({}, (err, success) => {
      if(err) throw err;
      db.collection('conversations').remove({}, (err, success) => {
        if(err) throw err;
        db.collection('messages').remove({}, (err, success) => {
          if(err) throw err;
          db.close()
          stop().then(_ => done())
        })
      })
    })
  })

  beforeEach(done => {
    Promise.all([
      connectHelper(token1),
      connectHelper(token2)
    ]).then(clients => {
      client1 = clients[0]
      client2 = clients[1]
      done()
    })
  })

  afterEach(done => {
    db.collection('messages').remove({}, (err, success) => {
      if(err) throw err;
      done()
    })
  })

  it('should emit an error event if no to property is provided', done => {
    const messageToSend = JSON.stringify({
      from: id1,
      data: {
        type: 'text',
        body: 'simple text'
      }
    })

    client1.onmessage = e => {
      const message = JSON.parse(e.data)
      expect(message.data.type).to.equal('error')
      expect(message.data.errors[0].params.missingProperty).to.equal('to')
      done()
    };
    client1.send(messageToSend)
  })

  it('should emit an error event if no from property is provided', done => {
    const messageToSend = JSON.stringify({
      to: id2,
      data: {
        type: 'text',
        body: 'simple text'
      }
    })

    client1.onmessage = e => {
      const message = JSON.parse(e.data)
      expect(message.data.type).to.equal('error')
      expect(message.data.errors[0].params.missingProperty).to.equal('from')
      done()
    };
    client1.send(messageToSend)
  })

  it('should send a message between users', (done) => {
    const messageToSend = {
      from: id1,
      to: id2,
      data: {
        type: 'text',
        body: 'simple text'
      }
    }

    client2.onmessage = e => {
      const message = JSON.parse(e.data)
      expect(message.data).to.deep.equal(messageToSend.data)
      done()
    };
    client1.send(JSON.stringify(messageToSend))
  })

  it('should persist a message sent between users', (done) => {
    const messageToSend = {
      from: id1,
      to: id2,
      data: {
        type: 'text',
        body: 'simple text'
      }
    }

    client2.onmessage = e => {
      db.collection('messages').find({}).toArray((err, docs) => {
        expect(docs.length).to.equal(1)
        expect(docs[0].data).to.deep.equal(messageToSend.data)
        expect(docs[0].from.toString()).to.equal(messageToSend.from)
        expect(docs[0].to.toString()).to.equal(messageToSend.to)
        expect(docs[0].key).to.equal([id1, id2].sort().join(':'))
        done()
      })
    }

    client1.send(JSON.stringify(messageToSend))
  })
})
