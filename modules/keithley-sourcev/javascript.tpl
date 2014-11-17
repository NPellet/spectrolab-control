
( function( stream ) {

	var button = $( "#measure-{{ module.id }}" )

	button.on( 'click', function() {

		stream.write( "{{ module.id }}", { method: "source", value: 

			{ 
				bias: $("#source-{{ module.id }}").prop('value'),
				channel: $("#channel-{{ module.id }}").prop('value')
			}

		} );

	} ); 


	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.method ) {
			case 'current':
				$("#current-{{ module.id }}").html( data.value );
			break;
		}
		

	})

}) ( window.io );