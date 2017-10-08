const { start, stop } = require('./../server.js')
const chai = require('chai')
const chaiHttp = require('chai-http')
const io = require('socket.io-client')
const expect = chai.expect


const TEST_PORT = 9092
const TEST_DB_URL = process.env.MONGO_URL_TEST
const API_URL = `http://localhost:${TEST_PORT}/api`
chai.use(chaiHttp)

describe('/conversation', () => {

  
});