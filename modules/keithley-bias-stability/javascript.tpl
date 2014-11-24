
( function( stream ) {

	var form = $( "#control-{{ module.id }}" );

	form.on( 'submit', function( e ) {

		e.stopPropagation();
		e.preventDefault();

		var data = serializeObjectWithFloats( form, [ 'totaltime', 'settlingtime', 'bias' ] );
		stream.write( "{{ module.id }}", { method: "measure", value: data } );
	} ); 


	form.find('input[name=biastype]').change( function() {

		$("#biasunit-{{ module-id }}").html(
		
			form.find('input[name=biastype]:checked').prop('value') == 'voltage' ? 'V' : 'A'
		);
	});

	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.method ) {

		}
	})

}) ( window.io );