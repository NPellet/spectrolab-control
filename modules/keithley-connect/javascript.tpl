
( function( stream ) {

	var button = $( "#{{ module.id }}" )

	button.on( 'click', function() {

		stream.write( "{{ module.id }}", "connect" );

	} ); 


	stream.onMessage( "{{ module.id }}", function( message ) {

		switch( message.method ) {

			case 'connected':

				button.addClass('connected');
				button.prop( 'value', 'Disconnect' );

			break;

			case 'disconnected':

				button.prop( 'value', 'Connect' );
				button.removeClass('connected');
			break;
		}

	})

}) ( window.io );