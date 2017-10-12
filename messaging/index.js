const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const Ajv = require('ajv');
const messageSchema = require('./message-schema.json')
const messageStore = require('./messageStore')
const { URL } = require('url')
const queryString = require('query-string');


const verifyClient = (info, cb) => {
  const { token } = queryString.parse(info.req.url.replace('/', ''))

  if (!token) { return cb(false, 401, 'Unauthorized'); }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) { return cb(false, 401, 'Unauthorized') }
    info.req.username = decoded.username;
    info.req.accoundId = decoded.id;
    cb(true);
  })
}

const init = server => {
  const wss = new WebSocket.Server({
    server,
    verifyClient
  });

  const ajv = new Ajv()
  this.validate = {
    message: ajv.compile(messageSchema)
  }

  this.connections = new Map();
  wss.on('connection', handleConnection)
}

const handleConnection = (ws, req) => {
  ws.upgradeReq = req;
  this.connections.set(req.accoundId, ws);
  ws.on('message', rawData => handleMessage(ws, rawData));
}

const validateMessage = rawData => {
  const message = JSON.parse(rawData);
  this.validate.message(message)
  const { errors } = this.validate.message
  return {
    errors,
    message
  }
}

const sendErrors = (ws, errors) => {
  ws.send(JSON.stringify({
    data: {
      type: 'error',
      errors
    }
  }))
}

const handleMessage = (fromWs, rawData) => {
  const { errors, message } = validateMessage(rawData)
  const toWs = this.connections.get(message.to)

  if (errors && fromWs)
    return sendErrors(fromWs, errors)

  messageStore.persist(message)
  toWs.send(JSON.stringify(message))
}

module.exports = { init }
