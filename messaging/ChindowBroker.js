const crypto = require('crypto');
const redis = require('redis');
const MESSAGE_TYPES = require('./messageTypes');
const Visitor = require('../models/Visitor');


const CLIENT = MESSAGE_TYPES.CLIENT;
const BROKER = MESSAGE_TYPES.BROKER;

class ChindowBroker {

  constructor(io) {
    this.sub = redis.createClient();
    this.pub = redis.createClient();
    this.sockets = {};
    this.sub.on('message', this.onChannelMessage.bind(this));
    this.sub.subscribe('from:slack');

    this.io = io;
    this.io.on('connection', (socket) => {
      this.socket = socket;
      this.addEventListeners(this.socket);
    });
  }

  addEventListeners(socket) {
    socket.on(CLIENT.RETURNING_VISITOR, message => this.onReturningVisitor(socket, message));
    socket.on(CLIENT.NEW_VISITOR, message => this.onNewVisitor(socket, message));
    socket.on(CLIENT.MESSAGE, message => this.onChindowMessage(socket, message));
  }

  onReturningVisitor(socket, message) {
    if (message.visitorId) {
      this.sockets[message.visitorId] = socket;
    }
  }

  onNewVisitor(socket, { teamId }) {
    const visitorId = crypto.randomBytes(48).toString('base64');
    socket.emit(BROKER.VISITOR_ID, { visitorId });

    const message = { type: 'new_visitor', visitorId, teamId };
    this.pub.publish('from:chindow', JSON.stringify(message));
    this.sockets[visitorId] = socket;
  }

  onChindowMessage(socket, message) {
    if (message.visitorId) {
      console.log(message.visitorId);
      Visitor.findOne({ visitorId: message.visitorId }).exec().then((result) => {
        Visitor.update(
          { visitorId: message.visitorId },
          {
            $set: {
              lastConversation: {
                started: Date.now(),
                missed: false,
              },
            },
          }).exec();
        const { channelId } = result;
        const channelMessage = {
          type: 'text',
          data: Object.assign({}, message.data, {
            channelId,
            teamId: message.teamId,
            visitorId: message.visitorId,
            author: 'them',
          }),
        };
        this.pub.publish('from:chindow', JSON.stringify(channelMessage));
      }).catch(err => {
        console.log(err);
      });
    }
  }

  onChannelMessage(redisChannel, messageData) {
    const message = JSON.parse(messageData);
    if (message.data && message.data.visitorId) {
      const socket = this.sockets[message.data.visitorId];
      if (socket) {
        socket.emit(BROKER.MESSAGE, { author: 'them', body: message.data.text });
      }
    }
  }
}

module.exports = ChindowBroker;
