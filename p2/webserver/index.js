var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var bodyParser = require("body-parser"); 
var session = require('express-session');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))


var auth = function(req,res,next){
	if(session.user){
	  return next();
	}else{
	  return res.redirect('/');	
	}
};


app.post('/login',function(req,res){	
	if(!req.body.nickname){
		res.send('login failed');
	}else {
		session.user= req.body.nickname;
		res.redirect('/xat');
		return; 
	}
});


app.get('/logout',function(req,res){
	req.session.destroy();
	res.send("logout success!");
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/xat', auth, function(req, res){

  res.sendFile(__dirname + '/xat.html');
});



io.on('connection', function(socket){
	
	socket.on('chat message', function(msg){
		socket.broadcast.emit('chat message', session.user+':'+msg);
	});

	socket.on('connect-room', function(id,name){
		socket.join(id);
		io.to(id).emit('join-message', name + ' has joined to room '+ id);
	});

	socket.on('room-message', function(id,msg){
		socket.broadcast.to(id).emit('room-message', session.user+':'+msg);	
	});

	socket.on('disconnect-room', function(id, name){
		socket.leave(id);
		io.to(id).emit('room-message', name + ' has left the room');
	});

});






http.listen(3000, function(){
  console.log('listening on *:3000');
});
