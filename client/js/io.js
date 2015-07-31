
define( [ 'js/modulefactory' ], function( moduleFactory ) {

	var connected = false;
	var ws;
	var ipAddress;

	var globalCallbacks = {};
	var onConnected = [];

	function handleGlobal( data ) {

		if( globalCallbacks[ data.instruction ] ) {
			globalCallbacks[ data.instruction ].map( function( c ) {
				c( data.value );
			})
		}
	}

	function setEvents( ws ) {
		// Stream is readyconsole.l

		ws.onopen = function( event ) {


			connected = true;

			onConnected.map( function( c ) {
				console.log('here');
				c();
			});

			opConnected = [];
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

				if( ! module ) {
					console.warn( "No module with ID " + data.moduleid + " existing." );
					console.warn( "Message ", data, " has not been transmitted" );
				}
				var dom = $( "#module-" + data.moduleid );

				if( data.instruction == "lock" ) {

					module._lock();

				} else if( data.instruction == "unlock" ) { // Unlocking module

					module._unlock();

				} else if( data.instruction == "setStatus" ) {

					module._setStatus( data.value );

				} else {

					module._receive( data.instruction, data.value );
				}
			} else {

				handleGlobal( data );
			}
		}
	}

	var send = function( message ) {

		if( ! connected ) {
			onConnected.push( function() {
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

		writeGlobal: function( message, value ) {

			sendJSON( { global: true, instruction: message, value: value } );
		},

		connect: function() {
			if( document.location.href.indexOf("127.0.0.1") > -1 ) {
				ipAddress = "127.0.0.1";
			}
			
			ws = new WebSocket('ws://' + ( ipAddress || '127.0.0.1' ) + ':8080');
			setEvents( ws );
		},

		setIp: function( ip ) {

			ipAddress = ip;
		},

		onGlobal: function( instruction, callback ) {

			globalCallbacks[ instruction ] = globalCallbacks[ instruction ]  || [];
			globalCallbacks[ instruction ].push( callback );
		}
	};

	return exports;

});
