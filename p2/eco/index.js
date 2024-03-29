var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket){

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
  
  socket.on('disconnect', function(){
   socket.disconnect();
   console.log("servidor is desconnected?: "+socket.disconnected);
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
