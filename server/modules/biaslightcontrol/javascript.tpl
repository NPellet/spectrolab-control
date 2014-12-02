
( function( stream ) {

	$("#module-{{ module.id }} .channel").toggles({text:{on:'Chan A',off:'Chan B'}});

	var div = $( "#biases-{{ module.id }}" )

	div.on( 'click', function() {

		var biases = [];
		div.find('input').each( function( i, checkbox ) {

			if( $( checkbox ).prop('checked') ) {

				biases.push( $( checkbox ).attr('data-level') );
			}

		});

		stream.write( "{{ module.id }}", { method: "biasselect", value: biases } );
	} ); 


	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.method ) {

		}
	})

}) ( window.io );