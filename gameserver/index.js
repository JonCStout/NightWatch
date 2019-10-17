
const io = require('socket.io')();
const port = process.env.PORT || 3000;

// var whosIt;
//var gamepieces = {};
var taggable = true;
// var clearTaggable;
var state = {
	aBox: { x: 200, y:200, color: "#0000ff" },  // initial values, #0000ff = blue.  "blue" also works
	whosIt: undefined
};

function onConnection(socket) {
	// initialization for a new socket connection
	console.log('Connection received: ' + socket.request.connection.remoteAddress + ", port:" + socket.request.connection.remotePort);
	socket.broadcast.emit('announce', {} );

	if (state.whosIt) {
		socket.emit('it', { "uuid": state.whosIt } );
	}

	socket.emit('state', state);  // send initial state


	// register callback functions for when network events are received
	socket.on('move', (data) => {
		// === State Management ===
		state.aBox.color = data.color;  // change color depending on who sent the move event

		// === Send network updates ===
		socket.broadcast.emit('moved', data, state);  // update movement AND state for all other sockets
		socket.emit('state', state);  // update state for this socket (the sender of move)
		
		socket.userid = data.uuid;
		
		// determine who's it
		if (!state.whosIt) {
			state.whosIt = data.uuid; 
			io.emit('it', { "uuid": state.whosIt } );
			//socket.broadcast.emit('it', { "uuid": state.whosit } )
		} 
	    //console.log('move received: ');
		//console.log(data);

	});

	socket.on('tagged', (data) => {
		if (data.olduuid && data.newuuid && getTaggable()) {
			setTaggable(false);
			state.whosIt = data.newuuid; 
			io.emit('it', { "uuid" : data.newuuid })
			setTimeout(function() { setTaggable(true); },3000);
		}
	});

	socket.on('disconnect', () => {
		if (state.whosIt == socket.userid) { state.whosIt = undefined; }
		socket.broadcast.emit('remove', { "uuid" : socket.userid });
		console.log('Client disconnected: ' + socket.request.connection.remoteAddress + ", port:" + socket.request.connection.remotePort);
	});
}

function getTaggable() {
	return taggable;
}
function setTaggable(value) {
	if (value != undefined) {
		taggable = value;
	} else { 
		taggable = true; 
	}
	//console.log('Taggable: ' + taggable);
}

io.on('connection', onConnection);

io.listen(port);
console.log('listening on port ',port);