const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

const users = {};

const onJoined = (sock) => {
  const socket = sock;
  socket.on('join', (data) => {
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };
    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    const response = {
      name: 'server',
      msg: `${data.name} has joined the room`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);

    users[socket.name] = socket.name;

    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    let message = '';

    if (data.msg === '/roll') {
      const rand = Math.floor(Math.random() * 6) + 1;
      message = `${data.name} rolled a ${rand} on a six sided die`;
    } else if (data.msg === '/date') {
      const date = new Date();
      message = `Server date is ${date.toDateString()}`;
    } else {
      message = data.msg;
    }
    message = message.replace('/me', data.name);
    io.sockets.in('room1').emit('msg', { name: data.name, msg: message });
  });
};

const onDisconnect = (sock) => {
  const socket = sock;
  delete users[socket.name];
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
