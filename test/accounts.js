const { start } = require('./../server.js')
const chai = require('chai')
const chaiHttp = require('chai-http')
const io = require('socket.io-client')
const MongoClient = require('mongodb').MongoClient
const expect = chai.expect

const TEST_PORT = 9092
const TEST_DB_URL = process.env.MONGO_URL_TEST
const SERVER_URL = `http://localhost:${TEST_PORT}`
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
      done()
    })
  })

  it('should not contain any accounts', (done) => {
    db.collection('accounts').find({}).toArray((err, docs) => {
      expect(docs.length).to.equal(0)
      done()
    })
  })

  describe('/signup', () => {

    afterEach((done) => {
      db.collection('accounts').drop(function (err, success) {
        if (err) throw err
        done()
      })
    })

    it('should create a new account', (done) => {
      chai.request(SERVER_URL)
        .post('/accounts/signup')
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
        chai.request(SERVER_URL)
          .post('/accounts/signup')
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
      chai.request(SERVER_URL)
      .post('/accounts/signup')
      .type('application/json')
      .send({
        username: 'newuser',
        password: 'password'
      })
      .end((err, res) => {
        expect(err).to.be.null
        done()
      })
    });

    it('should return a token with valid login', (done) => {
      chai.request(SERVER_URL)
      .post('/accounts/login')
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
      chai.request(SERVER_URL)
      .post('/accounts/login')
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
      chai.request(SERVER_URL)
      .post('/accounts/login')
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
})
