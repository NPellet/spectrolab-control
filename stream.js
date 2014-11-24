

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer( { port: 8080 } ),
	_connected = false;

var moduleCallbacks = {},
	streamReadyClbks = [];

function handleGlobal( message ) {

	switch( message.message[ 0 ] ) { // Message header

		case 'readystate':

			if( message.message[ 1 ] == 'streamready' ) {
				streamReady();
			}
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

	onClientConnection: function( callback ) {
		streamReadyClbks.push( callback );
	},

	isReady: function() {
		return _connected;
	}
}

module.exports = publicMethods;