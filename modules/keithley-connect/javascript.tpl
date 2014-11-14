
( function( stream ) {

	var button = $( "#{{ module.id }}" )

	button.on( 'click', function() {

		stream.write( "{{ module.id }}", "connect" );

	} ); 


	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data ) {

			case 'pending':

				button.prop( 'disabled', true );

			break;

			case 'connected':

				button.prop( 'disabled', false );
				button.prop( 'value', 'Disconnect' );

			break;

			case 'disconnected':

				button.prop( 'disabled', false );
				button.prop( 'value', 'Connect' );

			break;
		}

	})

}) ( window.io );