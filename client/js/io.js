
define( [ 'client/js/modulefactory' ], function( moduleFactory ) {

	var connected = false;
	var ws;

	function setEvents( ws ) {
		// Stream is ready
		ws.onopen = function( event ) {


			connected = true;

		};

		ws.onclose = function( ) {

	//		global.io.writeGlobal( "_streamClose", 1 );
			connected = false;
		}


		ws.onerror = function( ) {

			ws.close();
		//	global.io.writeGlobal( "_streamClose", 1 );
			connected = false;
		}


		ws.onmessage = function( event ) { // Message coming from the server

			var data = JSON.parse( event.data );
			var instruction = data.instruction;

			if( data.moduleid ) {

				var module = moduleFactory.getModule( data.moduleid );
				var dom = $( "#module-" + data.moduleid );

				if( data.instruction == "lock" ) {

					module._lock();

				} else if( data.instruction == "unlock" ) { // Unlocking module

					module._unlock();

				} else if( data.instruction == "setStatus" ) {

					module._setStatus( data.value );

				} else {
console.log( data );
					module._receive( data.instruction, data.value );
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

		write: function( moduleId, instruction, value ) {

			sendJSON( { moduleid: moduleId, instruction: instruction, value: value } );
		},

		writeGlobal: function( message ) {

			sendJSON( { global: true, message: message } );
		},

		connect: function() {

			ws = new WebSocket('ws://127.0.0.1:8080');
			setEvents( ws );
		}
	};

	return exports;

});
