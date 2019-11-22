
// Servidor web https que 1) fa de servidor web de l'HTML+JS de l'aplicació 
// de videoconferència feta amb WebRTC, i que alhora 2) fa de servidor de 
// senyalització fet amb socket.io

// El servidor web https "base"

var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');

const PORT = 443

var app = express();
var server = https.createServer({
        key: fs.readFileSync('certs/cert.key'),
        cert: fs.readFileSync('certs/cert.crt'),
}, app).listen(PORT, function() { console.log('https web server (signaling + html) is listening')});


//var server = http.createServer(app);

// El servidor web https com a servidor web de l'HTML+JS

//xxxx

// El servidor web https com a servidor de senyalització


// Es fa servir socket.io
var io = require('socket.io').listen(server);


app.use('/js',express.static(__dirname + '/public_html/js'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public_html/index.html');
});




// Vector on es guardem els identificadors dels usuaris
var usuarisConnectats = [];
var usuarisDesconnectats = 0;

var usuari1, usuari2; // els dos usuaris de l'aplicació

io.on('connection', function (socket){

	usuarisConnectats.push(socket.id); // s'ha connectat un usuari, socket.id té l'identificador
	console.log("USUARI ID -> " + socket.id + " || CONNECT");
	if (usuarisConnectats.length > 1){ // quan els dos usuaris s'han connectat al servidor

		usuari1 = usuarisConnectats[0];
		usuari2 = usuarisConnectats[1];

		io.to(usuari1).emit('message', {type:'newUser', msg:usuari2}); // s'envia info d'usuari1 -> usuari2
		io.to(usuari2).emit('message', {type:'newUser', msg:usuari1}); // s'envia info d'usuari2 -> usuari1
	}
	// les dades contenen el receiver socket id i el missatge; el que rebem ho reenviem al destí
	socket.on('message', function (message) {
		console.log(message)
		socket.to(message.to).emit('message', message);
	});

	socket.on('disconnect', function (message) {
		console.log("USUARI ID -> " + socket.id + " || DISCONNECT");
		if(usuari1 == socket.id){
			io.to(usuari2).emit('message', {type:'hangup'});
		}else{
			io.to(usuari1).emit('message', {type:'hangup'});
		}
		usuarisDesconnectats ++;

		if(usuarisDesconnectats > 1){
			// tots els usuaris s'han desconnectat
			console.log("ALL USERS DELETED FROM USER LIST");
			usuarisDesconnectats = 0;
			usuarisConnectats = [];
		}
	});
});


