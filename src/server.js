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
const users = io.sockets.sockets;

const onJoined = (sock) => {
  const socket = sock;
  socket.on('join', (data) => {
    // message back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    users[socket.name] = socket.name;

    socket.join('room1');
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    // io.sockets.in('room1').emit('msg', {name: socket.name,msg: data.msg});
    const splitMsg = data.msg.split(' ');
    const randNum = Math.floor(Math.random() * 6) + 1;
    switch (splitMsg[0]) {
      case '/dance':
        io.sockets.in('room1').emit('msg', { name: socket.name, msg: `${socket.name} dances.` });
        break;
      case '/username':
        io.sockets.in('room1').emit('msg', { name: splitMsg[1], msg: `${socket.name} changed their username to ${splitMsg[1]}.` });
        socket.name = splitMsg[1];
        break;
      case '/roll':
        io.sockets.in('room1').emit('msg', { name: socket.name, msg: `${socket.name} rolled a ${randNum} on a 6 sided die.` });
        break;
      default:
        io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
        break;
    }
  });
};

const onDisconnect = (sock) => {
  const socket = sock;
  socket.on('disconnect', (data) => {
    console.dir(data);

    const message = `${socket.name} has left the room.`;
    socket.broadcast.to('room1').emit('msg', { name: 'server', msg: message });
    socket.leave('room1');

    delete users[socket.name];
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
