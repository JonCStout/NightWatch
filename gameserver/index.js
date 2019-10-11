
const io = require('socket.io')();
const port = process.env.PORT || 3000;

var whosit;
//var gamepieces = {};
var taggable = true;
var clearTaggable;
var state = {
	aBox: { x: 200, y:200, color: "#0000ff" }  // initial values, #0000ff = blue.  "blue" also works
};

function onConnection(socket) {
	console.log('Connection received: ' + socket.request.connection.remoteAddress + ", port:" + socket.request.connection.remotePort);
	socket.broadcast.emit('announce', {} )

	if (whosit) {
		socket.emit('it', { "uuid": whosit } )
	}

	socket.emit('state', state);  // send initial state

	socket.on('move', (data) => { // register a callback function for when a move event is received
		state.aBox.color = data.color;  // change color depending on who sent the move event
		// socket.emit("state", state);  // update state for this socket (the sender of move)
		// socket.broadcast.emit("state", state);  // update state for all other sockets
		socket.broadcast.emit('moved', data, state);
		socket.emit('moved', data, state);
		socket.userid = data.uuid;
		// determine who's it
		if (!whosit) { 
			whosit = data.uuid; 
			io.emit('it', { "uuid": whosit } )
			//socket.broadcast.emit('it', { "uuid": whosit } )
		} 
	    //console.log('move received: ');
		//console.log(data);

	});

	socket.on('tagged', (data) => {
		if (data.olduuid && data.newuuid && getTaggable()) {
			setTaggable(false);
			whosit = data.newuuid; 
			io.emit('it', { "uuid" : data.newuuid })
			setTimeout(function() { setTaggable(true); },3000);
		}
	})

	socket.on('disconnect', () => {
		if (whosit == socket.userid) { whosit = undefined }
		socket.broadcast.emit('remove', { "uuid" : socket.userid })
	});
};

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