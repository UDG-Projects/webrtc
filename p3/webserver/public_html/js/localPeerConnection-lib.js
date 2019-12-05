function localPeerConnectionLib() { //pseudoclasse localPeerConnectionLib

	//ATRIBUTES
	var localips = {};
	var remoteips = {};
	var socket = null;
	var localPeerConnection = null;
	var remotePeerConnection = null;
	var remoteSocketId = null;

	//PUBLIC FUNCTIONS

	this.setSocket = function(sock){
		socket = sock;
	};

	this.setLocalPeerConnection = function(localPeer){
		localPeerConnection = localPeer;
	};

	this.setRemotePeerConnection = function (remotePeer){
		remotePeerConnection = remotePeer;
	};

	this.setRemoteSocketId = function (remoteSock){
		remoteSocketId = remoteSock;
	};

	//Handler associated with the management of remote peer connection's
	//data channel events
	this.gotReceiveChannel = function(event) {
		log('Receive Channel Callback: event --> ' + event);
		// Retrieve channel information
		receiveChannel = event.channel;

		// Set handlers for the following events:
		// (i) open; (ii) message; (iii) close
		receiveChannel.onopen = handleReceiveChannelStateChange;
		receiveChannel.onmessage = handleMessage;
		receiveChannel.onclose = handleReceiveChannelStateChange;
	};

	this.onSignalingError = function(error) {
		console.log('Failed to create signaling message : ' + error.name);
	};

	// Handler to be called whenever a new local ICE candidate becomes available
	this.gotLocalIceCandidate = function(event){
	  if (event.candidate) {
		log("Local ICE candidate: \n" + event.candidate.candidate);
		/*var ip = getipAddress(event.candidate.candidate);
		if(localips[ip]===undefined){
			localips[ip] = 	"Ip Local: "+ip+", Port UDP: "+event.candidate.port;		
		}*/
		socket.emit("message",{type:"localCandidate", data:event.candidate, to:remoteSocketId, from: socket.id});
	  }
	}

	// Handler to be called whenever a new 'remote' ICE candidate becomes available
	this.gotRemoteIceCandidate = function(event){
	  if (event.candidate) {
		log("Remote ICE candidate: \n " + event.candidate.candidate);
		/*var ip = getipAddress(event.candidate.candidate);
		if(remoteips[ip]===undefined){
			remoteips[ip] = "Ip Remote: "+ip+", Port UDP: "+event.candidate.port;		
		}*/
		socket.emit("message",{type:"remoteCandidate", data:event.candidate, to:remoteSocketId, from:socket.id});
	  }
	};

	//Handler for either 'open' or 'close' events on sender's data channel
	this.handleSendChannelStateChange = function() {
		var readyState = sendChannel.readyState;
		
		log('Send channel state is: ' + readyState);
		for(ipL in localips){
			log(localips[ipL]);			
		}
		for(ipR in remoteips){
			log(remoteips[ipR]);
		}
		if (readyState == "open") {
			// Enable 'Send' text area and set focus on it
			dataChannelSend.disabled = false;
			dataChannelSend.focus();
			dataChannelSend.placeholder = "";
			// Enable both 'Send' and 'Close' buttons
			sendButton.disabled = false;
			if(localPeerConnection!=null && remotePeerConnection!=null){
				getConnectionDetails(localPeerConnection).then(console.log.bind(console));
				//console.log(localPeerConnection.currentRemoteDescription);
			}
	
		} else { // event MUST be 'close', if we are here...
			// Disable 'Send' text area
			dataChannelSend.disabled = true;
			// Disable both 'Send' and 'Close' buttons
			sendButton.disabled = true;
		}
	}

	// Handler to be called when the 'local' SDP becomes available
	this.gotLocalDescription = function(description){
	  // Add the local description to the local PeerConnection
	  localPeerConnection.setLocalDescription(description);
	  log("Offer from localPeerConnection: \n" + description.sdp);

	  socket.emit("message",{type:"offer", data:description, to:remoteSocketId, from:socket.id});
	}

	// Handler to be called when the 'remote' SDP becomes available
	this.gotRemoteDescription = function(description){
	  // Set the 'remote' description as the local description of the remote PeerConnection
	  remotePeerConnection.setLocalDescription(description);
	  log("Description: ");
	  socket.emit("message",{type:"answer", data:description, to:remoteSocketId, from:socket.id});
	}
}

//PRIVATE FUNCTIONS

	function getipAddress(msg){		
		return msg.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
	};
//Handler for either 'open' or 'close' events on receiver's data channel
	function handleReceiveChannelStateChange()  {
		var readyState = receiveChannel.readyState;
		log('Receive channel state is: ' + readyState);
	};

	//Message event handler
	function handleMessage(event) {
		log('Received message: ' + event.data);
		// Show message in the HTML5 page
		document.getElementById("dataChannelReceive").value = event.data;
		// Clean 'Send' text area in the HTML page
		document.getElementById("dataChannelSend").value = '';
	};


function getConnectionDetails(peerConnection){


  var connectionDetails = {};   // the final result object.

  /*if(window.chrome){  // checking if chrome

    var reqFields = [   'googLocalAddress',
                        'googLocalCandidateType',   
                        'googRemoteAddress',
                        'googRemoteCandidateType'
                    ];
    return new Promise(function(resolve, reject){
      peerConnection.getStats(function(stats){
	console.log(stats)
	stats.forEach(function(stat){	
		if(stat.selected){
			selectedCandidatePair=stat;		
		}
	});
        var filtered = stats.result().filter(function(e){return e.id.indexOf('Conn-audio')==0 && e.stat('googActiveConnection')=='true'})[0];
        if(!filtered) return reject('Something is wrong...');
        reqFields.forEach(function(e){connectionDetails[e.replace('goog', '')] = filtered.stat(e)});
        resolve(connectionDetails);
      });
    });

  }else{*/ // assuming it is firefox
    return peerConnection.getStats(null).then(function(stats){
	var selectedCandidatePair; 
	stats.forEach(function(stat){	
		if(stat.selected){
			selectedCandidatePair=stat;		
		}
	});
	
	var localICE, remoteICE;
	stats.forEach(function(stat){
		if(stat.id==selectedCandidatePair.localCandidateId){
			localICE=stat;		
		}
		if(stat.id==selectedCandidatePair.remoteCandidateId){
			remoteICE=stat;		
		}
			
	});

        connectionDetails.LocalAddress = [localICE.address, localICE.port].join(':');
        connectionDetails.RemoteAddress = [remoteICE.address, remoteICE.port].join(':');
        connectionDetails.LocalCandidateType = localICE.candidateType;
        connectionDetails.RemoteCandidateType = remoteICE.candidateType;
        return connectionDetails;
    });

  //}
}


