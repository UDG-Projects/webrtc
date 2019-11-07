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
	if(req.session.user){
console.log("next");
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
console.log("index");
  res.sendFile(__dirname + '/index.html');
});

app.get('/xat', auth, function(req, res){
console.log("xat")
console.log(__dirname)
  res.sendFile(__dirname + '/xat.html');
});



io.on('connection', function(socket){
  socket.on('chat message', function(msg){
  	socket.broadcast.emit('chat message', msg);
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
