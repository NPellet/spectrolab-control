
( function( stream ) {

	var form = $( "#hall-{{ module.id }}" )

	form.on( 'submit', function( e ) {

		e.stopPropagation();
		e.preventDefault();

	
		var data = serializeObjectWithFloats( form, [ 'current' ] );

		module.out( "measure", data );
	} ); 

	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.method ) {

		}
	})

}) ( window.io );