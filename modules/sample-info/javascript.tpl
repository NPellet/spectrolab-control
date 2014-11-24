
( function( stream ) {

	//$("#module-{{ module.id }} .channel").toggles({text:{on:'Chan A',off:'Chan B'}});


	var form = $( "#form-{{ module.id }}" )

	form.on( 'change, keyup', 'input', function() {
		var data = serializeObjectWithFloats( form, [] );
		stream.write( "{{ module.id }}", { method: "change", value: data });
	} ); 


	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.method ) {

		}
	})

}) ( window.io );