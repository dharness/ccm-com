const WebSocket = require('ws')
var jwt = require('jsonwebtoken')


const verifyClient = (info, cb) => {
  const { token } = info.req.headers
  if (!token) { return cb(false, 401, 'Unauthorized'); }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) { return cb(false, 401, 'Unauthorized') }
    info.req.username = decoded.username;
    cb(true);
  })
}

const init = (server) => {
  const wss = new WebSocket.Server({
    server,
    verifyClient
  });
  this.connections = new Map();
  wss.on('connection', handleConnection)
}

const handleConnection = (ws, req) => {
  this.connections.set(req.username, ws);
  ws.on('message', handleMessage);
}

const handleMessage = rawData => {
  const message = JSON.parse(rawData);
  const toWs = this.connections.get(message.to);
  toWs.send(JSON.stringify(message));
}

module.exports = { init }
