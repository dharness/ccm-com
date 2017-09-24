require('dotenv').config();
const app = require('express')();
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 9091;
const server = require('http').Server(app);
const io = require('socket.io')(server);
const messaging = require('./messaging');
const connectDb = require('./services/connections').connect;
const accountController= require('./routes/accounts');
const { configureStrategies } = require('./config/passport');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());
const passport = configureStrategies();
app.use(passport.initialize());
app.use('/accounts', accountController);
messaging.init(io);

app.get('/', (req, res) => {
  res.send({ status: 200 })
});

const start = async (_PORT=PORT, DB_URL) => {
  await connectDb(DB_URL);
  server.listen(_PORT, () => {
    console.log(`COM-SERVER listening at http://localhost:${_PORT}`)
  });
}

if (require.main === module) {
  start();
}

module.exports = { start };