
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
var count = 0;

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  socket.on('join', (username) => {
    if (!socket.username) {
      socket.username = username;
      socket.broadcast.emit('message', {
        username: 'Server',
        message: `${username} has joined the chat`,
      });
    }
  });

  socket.on('message', (message) => {
    io.emit('message', {
      username: socket.username,
      message,
    });
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('message', {
        username: 'Server',
        message: `${socket.username} has left the chat`,
      });
    }
  });
});

server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
