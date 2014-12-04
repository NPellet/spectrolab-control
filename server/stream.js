
var Promise = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer( { port: 8080 } );

var moduleCallbacks = {};
var modulesEventEmittter = new EventEmitter();

var _connected = false;

/*
 MODULES AND COMMUNICATION READY HANDLING
*/
var streamReadyResolve,
	modulesReadyResolve;

var streamReady = new Promise( function( resolve ) {
	streamReadyResolve = resolve;
});


var modulesReady = new Promise( function( resolve ) {
	modulesReadyResolve = resolve;
});

var clientReady = Promise.all( [ streamReady, modulesReady ] );


function handleGlobal( message ) {

	switch( message.message[ 0 ] ) { // Message header

		case '_streamOpen':
			streamReadyResolve();
		break;

		case 'modulesReady':
			modulesReadyResolve();
		break;
	}
}

function streamReady() {

	// Executes all callbacks on stream ready...
	streamReadyClbks.map( function( c ) {
		c();
	});
}

wss.on('connection', function( ws ) {

	_connected = true;
	_ws = ws;
    //ws.send('something');
});

// On message should be out of the loop. 
wss.on('message', function( message ) {
    
	if( ! _connected ) {
		return;
	}

	var jsonParsed = JSON.parse( message );

	if( jsonParsed.global ) {

		handleGlobal( jsonParsed );
		return;
	}

	if( jsonParsed.moduleid ) {

		modulesEventEmittter.emit( jsonParsed.moduleid + "." + jsonParsed.instruction, jsonParsed.value, jsonParsed.instruction )
	}

//        publicMethods.onMessage( message );
});


var publicMethods = {

	write: function( moduleid, instruction, value ) {

		if( ! _connected ) {
			throw "No websocket connection established";
		}

		if( Array.isArray( instruction ) ) {
			instruction = instruction.join( "." );
		}
		
		var json = {

			moduleid: moduleid,
			instruction: instruction,
			value: value
		};

		_ws.send( JSON.stringify( json ) );
	},

	onMessage: function( moduleid, instruction, callback ) {

		modulesEventEmittter.on( moduleid + "." + instruction, callback );
	},

	onClientReady: function( callback ) {

		clientReady.then( callback );
	},

	isReady: function() {

		return clientReady.isFulfilled();
	}
}

module.exports = publicMethods;