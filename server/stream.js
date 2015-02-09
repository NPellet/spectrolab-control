
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
var clientReady;

function makePromise() {
	var streamReady = new Promise( function( resolve ) {
		streamReadyResolve = resolve;
	});


	var modulesReady = new Promise( function( resolve ) {
		modulesReadyResolve = resolve;
	});

	clientReady =  Promise.all( [ streamReady, modulesReady ] );
}

makePromise();

function handleGlobal( message ) {

	switch( message.message ) { // Message header

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

function messageReceived( message ) {
	
    
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

}


wss.on('connection', function( ws ) {

	if( _connected ) {
		throw "Cannot connect twice. Another connection is active";
	}

	_connected = true;
	_ws = ws;

    // New websocket instance.
    ws.on('message', messageReceived);
    ws.on("close", function( ) {
		_connected = false;
		makePromise();
	});

});

var clientReadyCallbacks = [];

var publicMethods = {

	write: function( moduleid, instruction, value ) {

		clientReady.then( function() {

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
		});
	},

	onMessage: function( moduleid, instruction, callback ) {

		modulesEventEmittter.on( moduleid + "." + instruction, callback );
	},

	onClientReady: function( callback ) {
		clientReady.then( function() {
			callback();
		});
	},

	isReady: function() {

		return clientReady.isFulfilled();
	}
}

module.exports = publicMethods;