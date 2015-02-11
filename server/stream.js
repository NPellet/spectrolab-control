
var Promise = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var WebSocketServer = require('ws').Server;

var modulesEventEmittter = new EventEmitter();
var allModules = [];
var connections = [];

var wss = new WebSocketServer( { port: 8080 } ); // Default port

// Server handles incoming wss connections
wss.on('connection', function( ws ) {

  // Add connection to the array
  connections.push( ws );

  // New websocket instance.
  ws.on( "message", function( message ) {
  		console.log( message );
		// Parse the JSON
		var jsonParsed = JSON.parse( message );

		// Global message ?
		if( jsonParsed.global ) {

			handleGlobal( jsonParsed );
			return;
		}

		// Message from a particular module
		if( jsonParsed.moduleid ) {

			if( jsonParsed.instruction == "getStatus" ) { // Module is requesting current status
console.log('get Status');
				var output = prepareOutput( allModules[ jsonParsed.moduleid ], "setStatus", allModules[ jsonParsed.moduleid ].getStatus() )
				this.send( output );

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


module.exports = {

	moduleOut: function( module, instruction, value ) {

		var output = prepareOutput( module, instruction, value );

		connections.map( function( connection ) {

			connection.send( output );
		} );

	},

	moduleIn: function( moduleid, instruction, callback ) { // Register module callbacks
		modulesEventEmittter.on( moduleid + "." + instruction, callback );
	},

	setModules: function( modules ) {
		allModules = modules;
	}

};
