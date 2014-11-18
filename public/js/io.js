( function( global ) {

	var ws = new WebSocket('ws://192.168.0.12:8080');

	ws.onopen = function (event) {

	};

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

	global.io = {

		_callbacks: {},

		onMessage: function( moduleId, callback ) {

			this._callbacks[ moduleId ] = this._callbacks[ moduleId ] || [];
			this._callbacks[ moduleId ].push( callback );

		},

		write: function( moduleId, message ) {

			ws.send( JSON.stringify( { moduleid: moduleId, message: message } ) );

		}

	};

}) ( window )