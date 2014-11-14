

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer( { port: 8080 } ),
	_connected = false;

wss.on('connection', function( ws ) {

	_connected = true;
    ws.on('message', function( message ) {
        
    	var jsonParsed = JSON.parse( message );

    	if( jsonParsed.moduleId && callbacks[ jsonParsed.moduleid ] ) {

    		callbacks[ jsonParsed.moduleid ].map( function( func ) {

    			func( message );
    		} );
    	}

        publicMethods.onMessage( message );
    });

    ws.send('something');
});

var publicMethods = {

	write: function( message ) {

		if( ! _connected ) {
			throw "No websocket connection established";
		}

		ws.send( message );
	},

	onMessage: function( moduleid, callback ) {

		callbacks[ moduleid ] = callbacks[ moduleid ] || [ ];
		callbacks[ moduleid ].push( callback );
	}
}

exports = publicMethods;