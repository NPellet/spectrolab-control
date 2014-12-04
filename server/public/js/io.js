
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

	ws.onmessage = function( event ) {
		
		var data = JSON.parse( event.data );

		if( global.io._callbacks[ data.moduleid ] ) {

			global.io._callbacks[ data.moduleid ].map( function( callback ) {

				if( data.message.method == "lock" ) {

					var dom = $( "#module-" + data.moduleid );

					if( data.message.value ) {

						if( dom.find( '.overlay' ).length > 0 ) {
							return;
						}

						lockModule( dom );
						
					} else {

						unlockModule( dom );
					}
				} else {

					callback( data.message );
				}
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


	global.io = {

		_callbacks: {},

		onMessage: function( moduleId, callback ) {

			this._callbacks[ moduleId ] = this._callbacks[ moduleId ] || [];
			this._callbacks[ moduleId ].push( callback );

		},

		write: function( moduleId, message ) {

			send( JSON.stringify( { moduleid: moduleId, message: message } ) );
			
		},


		writeGlobal: function( ) {

			send( JSON.stringify( { global: true, message: arguments } ) );

		}


	};

}) ( window, jQuery )