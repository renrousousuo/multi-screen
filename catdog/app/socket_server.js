var io = require('socket.io').listen(8081);

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('chat_message', function (data) {
    console.log('chat_message : ' + data);
    socket.emit('chat_msg_send', data);
  });
  
  /*socket.on('message', function(){
    console.log('message...');
  });*/
  socket.on('disconnect', function(){
    console.log('disconnect...');
  });
});

