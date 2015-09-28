
define( [ 'moduleFactory' ], function( moduleFactory ) {

	var ws = new WebSocket('ws://127.0.0.1:8080');
	var connected = false;

	// Stream is ready
	ws.onopen = function( event ) {

		global.io.writeGlobal( "_streamOpen", 1 );

		moduleFactory.allModules( function( module ) {

			module.getStatus();
		});

		connected = true;

	};

	ws.onclose = function( ) {

		global.io.writeGlobal( "_streamClose", 1 );
		connected = false;
	}


	ws.onerror = function( ) {

		ws.close();
		global.io.writeGlobal( "_streamClose", 1 );
		connected = false;
	}


	ws.onmessage = function( event ) { // Message coming from the server

		var data = JSON.parse( event.data );
		var instruction = data.instruction;

		if( data.moduleid ) {

			var module = moduleFactory.getModule( data.moduleid );


			if( data.instruction == 'lock' || data.instruction == 'unlock' ) { // Locking the module

				var dom = $( "#module-" + data.moduleid );

				if( data.instruction == "lock" ) {

					module.lock();

				} else if( data.instruction == "unlock" ) { // Unlocking module

					module.unlock();

				} else if( data.instruction == "setStatus" ) {

					module.setStatus( data.value );
					
				} else {

					module.receive( data.instruction, data.message );
				}
			}

		}
	}

	var send = function( message ) {

		if( ! connected ) {
			onConnected.add( function() {
				ws.send( message );
			})
		} else {
			ws.send( message );
		}
	}

	var sendJSON = function( json ) {
		send( JSON.stringify( json ) );
	}

	var exports = {

		_callbacks: {},

		moduleMessage: function( moduleId, instruction, callback ) {

			var callbacks = global.io._callbacks
			callbacks[ moduleId ] = callbacks[ moduleId ] || [];
			callbacks[ moduleId ][ instruction ] = callbacks[ moduleId ][ instruction ] || [];
			callbacks[ moduleId ][ instruction ].push( callback );
		},

		write: function( moduleId, instruction, value ) {

			sendJSON( { moduleid: moduleId, instruction: instruction, value: value } );
		},

		writeGlobal: function( message ) {

			sendJSON( { global: true, message: message } );
		}
	};

	return exports;

});
