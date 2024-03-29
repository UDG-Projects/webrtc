var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var bodyParser = require("body-parser"); 
//var session = require('express-session');
//var sharedsession = require('express-socket.io-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const session = require('express-session')({  
   secret: 'keyboard cat',
   resave: true,
   saveUninitialized: true
});
const sharedsession = require('express-socket.io-session');

app.use(session);
io.use(sharedsession(session));


/*app.use(session({
    secret: 'keyboard cat',
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
*/
//io.use(sharedsession(session));

var auth = function(req,res,next){
	if(req.session.user){
	  return next();
	}else{
	  return res.redirect('/');	
	}
};


app.post('/login',function(req,res){	
	if(!req.body.nickname){
		res.send('login failed');
	}else {
		req.session.user= req.body.nickname;
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
		socket.broadcast.emit('chat message', socket.handshake.session.user+':'+msg);
	});

	socket.on('connect-room', function(id){
		socket.join(id);
		io.to(id).emit('join-message', socket.handshake.session.user + ' has joined to room '+ id);
	});

	socket.on('room-message', function(id,msg){
		socket.broadcast.to(id).emit('room-message', socket.handshake.session.user+':'+msg);	
	});

	socket.on('disconnect-room', function(id){
		socket.leave(id);
		io.to(id).emit('room-message', socket.handshake.session.user + ' has left the room');
	});

});






http.listen(3000, function(){
  console.log('listening on *:3000');
});
