
var Promise = require("bluebird");

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer( { port: 8080 } ),
	_connected = false;

var moduleCallbacks = {};

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

    ws.on('message', function( message ) {
        
//        console.log('Received: ' + message );

    	var jsonParsed = JSON.parse( message );

    	if( jsonParsed.global ) {

    		handleGlobal( jsonParsed );
    		return;
    	}

    	if( jsonParsed.moduleid && moduleCallbacks[ jsonParsed.moduleid ] ) {

    		moduleCallbacks[ jsonParsed.moduleid ].map( function( func ) {

    			func( jsonParsed.message );
    		} );
    	}

        publicMethods.onMessage( message );
    });

    //ws.send('something');
});

var publicMethods = {

	write: function( moduleid, message ) {

		if( ! _connected ) {
			throw "No websocket connection established";
		}

		var json = {
			moduleid: moduleid,
			message: message
		}

		_ws.send( JSON.stringify( json ) );
	},

	onMessage: function( moduleid, callback ) {

		moduleCallbacks[ moduleid ] = moduleCallbacks[ moduleid ] || [ ];
		moduleCallbacks[ moduleid ].push( callback );
	},

	onClientReady: function( callback ) {
		clientReady.then( callback );
	},

	isReady: function() {
		return clientReady.isFulfilled();
	}
}

module.exports = publicMethods;