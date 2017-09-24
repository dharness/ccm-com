const redis = require('redis');
const axios = require('axios');
const querystring = require('querystring');
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RtmClient = require('@slack/client').RtmClient;
const Moniker = require('moniker');
const Visitor = require('../models/Visitor');
const Account = require('../models/Account');
const winston = require('winston');


const SLACK_API_URL = 'https://slack.com/api';

class SlackBroker {

  constructor({ botToken }) {
    this.sub = redis.createClient();
    this.pub = redis.createClient();
    this.channelIds = {};
    this.sub.on('message', this.onChannelMessage.bind(this));
    this.sub.subscribe('from:chindow');


    this.botToken = botToken;
    this.rtm = new RtmClient(botToken);
    this.channelMap = {};
    this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, this.onClientAuthenticated.bind(this));
    // this.rtm.on(CLIENT_EVENTS.RTM.RAW_MESSAGE, this.onSlackMessage.bind(this));
    this.rtm.on('message', this.forwardMessageToChindow.bind(this));
    this.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, this.onStartErr.bind(this));
    this.rtm.start();
  }

  onStartErr(err) {
    winston.warn(err);
  }

  onClientAuthenticated(rtmStartData) {
    this.teamId = rtmStartData.users[0].team_id;
    rtmStartData.channels.forEach((channel) => {
      this.channelMap[channel.name] = channel.id;
    });
    winston.info(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  }

  _onSlackMessage(data) {
    const message = JSON.parse(data);
    const { type, subtype } = message;
    if (type !== 'pong') {
      winston.info(`
        type:     ${message.type}
        subtype:  ${message.subtype}
        ----------------------------------------`);
    }
    if (type === 'message') {
      if (!subtype) {
        this.forwardMessageToChindow(message);
      }
    }
  }

  onChannelMessage(redisChannel, channelMessage) {
    const message = JSON.parse(channelMessage);
    if (message.type === 'text') {
      this.forwardMessageToSlack(message);
    } else if (message.type === 'new_visitor' && message.teamId === this.teamId) {
      const channelName = Moniker.choose();
      this.createChannel(channelName, message.visitorId, message.teamId);
    }
  }

  forwardMessageToChindow(message) {
    if(message.bot_id) { return; }

    Visitor.findOne({ channelId: message.channel }).exec().then((visitor) => {
      if (visitor) {
        const channelMessage = {
          type: 'text',
          data: Object.assign({}, message, {
            visitorId: visitor.visitorId,
          }),
        };
        winston.info(channelMessage);
        this.pub.publish('from:slack', JSON.stringify(channelMessage));
      } else {
        winston.info(message, 'Converation not found');
      }
    }).catch((err) => {
      winston.error(err);
    });
  }

  async forwardMessageToSlack(message) {
    const slackChannelId = message.data.channelId;
    if (slackChannelId) {
      const { teamId } = message.data;

      const account = await Account.findOne({'slack.team.id': teamId}).exec();
      const params = querystring.stringify({
        token: account.slack.accessToken,
        channel: slackChannelId,
        text: message.data.text
      });
      return axios.post(`${SLACK_API_URL}/chat.postMessage`, params);
    }
  }

  addToChannel({ token, channelId, botId }) {
    const params = {
      token,
      channel: channelId,
      user: botId,
    };
    return axios.post(`${SLACK_API_URL}/channels.invite`, querystring.stringify(params))
      .then((response) => {
        if (response.status !== 200) {
          winston.warn('Error inviting to channel');
        }
        return channelId;
      });
  }

  createChannel(name, visitorId, teamId) {
    return Account.findOne({ 'slack.team.id': teamId }).exec().then((account) => {
      if (!account) { return false; }

      const token = account.slack.accessToken;
      // const botId = account.bot.bot_user_id;

      return axios.post(`${SLACK_API_URL}/channels.create`, querystring.stringify({ token, name }))
          .then((response) => {
            if (response.status !== 200) {
              winston.error('Failed to create channel');
            }
            const channelId = response.data.channel.id;
            return channelId;
            // return this.addToChannel({ token, channelId, botId });
          })
          .then((channelId) => {
            return new Visitor({
              visitorId,
              channelId,
              teamId,
            }).save();
          }).catch((err) => {
            winston.error('Error creating channel', err);
          });
    });
  }

}

module.exports = SlackBroker;
