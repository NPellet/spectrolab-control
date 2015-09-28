
var Promise = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var WebSocketServer = require('ws').Server;

var modulesEventEmittter = new EventEmitter();
var allModules = [];
var connections = [];
var globalCallbacks = {};

var wss = new WebSocketServer( { port: 8080 } ); // Default port

// Server handles incoming wss connections
wss.on('connection', function( ws ) {

  // Add connection to the array
  connections.push( ws );

  // New websocket instance.
  ws.on( "message", function( message ) {

		// Parse the JSON
		var jsonParsed = JSON.parse( message );

		// Global message ?
		if( jsonParsed.global ) {

			handleGlobal( jsonParsed, ws );
			return;
		}

		// Message from a particular module
		if( jsonParsed.moduleid ) {

			if( jsonParsed.instruction == "getStatus" ) { // Module is requesting current status

				allModules[ jsonParsed.moduleid ].sendStatus( ws );
				allModules[ jsonParsed.moduleid ].streamLock();

			} else {

				modulesEventEmittter.emit( jsonParsed.moduleid + "." + jsonParsed.instruction, jsonParsed.value, jsonParsed.instruction )
			}
		}


	} );

  	ws.on( "close", function( ) {

		// Remove connections from stack
		connections.splice( connections.indexOf( this ), 1 );

	});

});


function prepareOutput( module, instruction, value ) {

	if( Array.isArray( instruction ) ) {
		instruction = instruction.join( "." );
	}

	return JSON.stringify( {
		moduleid: module.getId(),
		instruction: instruction,
		value: value
	} );
}

function handleGlobal( json, ws ) {


	if( globalCallbacks[ json.instruction ] ) {
		globalCallbacks[ json.instruction ].map( function( c ) {
			
			c( json.value, ws );
		})
	}
}

module.exports = {

	moduleOut: function( module, instruction, value, ws ) {

		var output = prepareOutput( module, instruction, value );

		if( ! ws ) {
			connections.map( function( connection ) {

				connection.send( output );
			} );
		} else {
			ws.send( output );
		}
	},

	moduleIn: function( moduleid, instruction, callback ) { // Register module callbacks
		modulesEventEmittter.on( moduleid + "." + instruction, callback );
	},

	setModules: function( modules ) {
		allModules = modules;
	},

	onGlobalMessage: function( instruction, callback ) {
		globalCallbacks[ instruction ] = globalCallbacks[ instruction ] || [];
		globalCallbacks[ instruction ].push( callback );
	},

	globalOut: function( instruction, value, ws ) {

		var output = JSON.stringify( { instruction: instruction, value: value } );

		if( ! ws ) {
			connections.map( function( connection ) {

				connection.send( output );
			} );
		} else {

			ws.send( output );
		}

	}

};
