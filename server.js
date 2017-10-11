require('dotenv').config();
const app = require('express')();
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 9091;
const server = require('http').Server(app);
const messaging = require('./messaging');
const api = require('./api');
const { configureStrategies } = require('./config/passport');
const {
  connect: connectDb,
  disconnect: disconnectDb,
} = require('./services/connections');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

messaging.init(server);
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "token, Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());
const passport = configureStrategies();
app.use(passport.initialize());
app.use('/api', api);


app.get('/', (req, res) => {
  res.send({ status: 200 })
});

const start = async (_PORT=PORT, DB_URL) => {
  await connectDb(DB_URL);
  server.listen(_PORT, () => {
    console.log(`COM-SERVER listening at http://localhost:${_PORT}`)
  });
}

const stop = async () => {
  server.close()
  return disconnectDb();
}

if (require.main === module) {
  start();
}

module.exports = { start, stop };