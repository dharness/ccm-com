const { start } = require('./../server.js');
const expect = require('chai').expect;
const io = require('socket.io-client');

const TEST_PORT = 9091;
const SOCKET_URL = `http://localhost:${TEST_PORT}`

describe('Socket server', () => {
  var client1, client2;

  // before(() => start(TEST_PORT));

  beforeEach((done) => {
    let connected = [];
    client1 = io.connect(SOCKET_URL);
    client2 = io.connect(SOCKET_URL);
    client1.on('connect', () => {
      connected.push(client1.id);
      connected.length === 2 && done();
    });
    client2.on('connect', () => {
      connected.push(client2.id);
      connected.length === 2 && done();
    });
  });

  afterEach((done) => {
    client1.disconnect();
    client2.disconnect();
    done();
  });

  it('should login', (done) => {
    client1.emit('MESSAGE', 'abcd123');
    client2.on('MESSAGE', res => {
      console.log(res);
      expect(6).to.equal(6);
      done();
    });
  });

});