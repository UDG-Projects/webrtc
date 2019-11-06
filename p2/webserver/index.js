var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket){
  socket.on('chat message', function(msg){
  	socket.broadcast.emit('chat message', msg);
  });

	socket.on('connect-room', function(id,name){
		socket.join(id)
    io.to(id).emit('join-message', name + ' has joined to room '+ id);
  });

	socket.on('room-message', function(id,msg){
		socket.broadcast.to(id).emit('room-message', msg);	
	});

});






http.listen(3000, function(){
  console.log('listening on *:3000');
});
