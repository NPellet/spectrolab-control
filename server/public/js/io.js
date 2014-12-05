
( function( global, $ ) {

	var ws = new WebSocket('ws://127.0.0.1:8080');
	var connected = false;
	var onConnected = $.Callbacks();
	var onDisconnected = $.Callbacks();

	// Stream is ready
	ws.onopen = function( event ) {
		global.io.writeGlobal( "_streamOpen", 1 );
		connected = true;
		onConnected.fire();
	};

	ws.onclose = function( ) {
		
		global.io.writeGlobal( "_streamClose", 1 );
		connected = false;
		onDisconnected.fire();
	}


	ws.onerror = function( ) {
		
		global.io.writeGlobal( "_streamClose", 1 );
		connected = false;
		onDisconnected.fire();
	}


	ws.onmessage = function( event ) {
		
		var data = JSON.parse( event.data );
		var instruction = data.instruction;

		if( global.io._callbacks[ data.moduleid ] ) {

			if( data.instruction == "lock" ) {

				var dom = $( "#module-" + data.moduleid );
				if( dom.find( '.overlay' ).length > 0 ) {
					return;
				}

				lockModule( dom );
				return;
				
			} else if( data.instruction == "unlock" ) {

				unlockModule( dom );
				return;
			}
		}

		if( global.io._callbacks[ data.moduleid ] && global.io._callbacks[ data.moduleid ][ instruction ] ) {

			global.io._callbacks[ data.moduleid ][ instruction ].map( function( callback ) {

				callback( data.value, data );
			} );
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

	global.io = {

		_callbacks: {},

		onMessage: function( moduleId, instruction, callback ) {

			this._callbacks[ moduleId ] = this._callbacks[ moduleId ] || [];
			this._callbacks[ moduleId ][ instruction ] = this._callbacks[ moduleId ][ instruction ] || [];

			this._callbacks[ moduleId ][ instruction ].push( callback );

		},

		write: function( moduleId, instruction, value ) {

			sendJSON( { moduleid: moduleId, instruction: instruction, value: value } );
		},


		writeGlobal: function( message ) {

			sendJSON( { global: true, message: message } );
		}
	};

}) ( window, jQuery );