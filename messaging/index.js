module.exports = {

  init(io) {
    io.on('connection', this.handleConnection.bind(this));
  },

  handleConnection(socket) {

    socket.on('MESSAGE', msg => {
      socket.broadcast.emit('MESSAGE', msg.split('').reverse().join(''));
    });
  },

  handleMessage(data) {
    console.log(data);
  }
};
