

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer( { port: 8080 } ),
	_connected = false;

var callbacks = {};

wss.on('connection', function( ws ) {

	_connected = true;
	_ws = ws;

    ws.on('message', function( message ) {
        
//        console.log('Received: ' + message );

    	var jsonParsed = JSON.parse( message );

    	if( jsonParsed.moduleid && callbacks[ jsonParsed.moduleid ] ) {

    		callbacks[ jsonParsed.moduleid ].map( function( func ) {

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

		callbacks[ moduleid ] = callbacks[ moduleid ] || [ ];
		callbacks[ moduleid ].push( callback );
	},

	isReady: function() {
		return ! _connected;
	}
}

module.exports = publicMethods;