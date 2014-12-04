
( function( ) {

	var form = $( "#control-{{ module.id }}" );

	form.on( 'submit', function( e ) {

		e.stopPropagation();
		e.preventDefault();

		var data = serializeObjectWithFloats( form, [ 'totaltime', 'settlingtime', 'bias' ] );
		module.out( "measure", data );

	} ); 


	form.find('input[name=biastype]').change( function() {

		$("#biasunit-{{ module-id }}").html(
		
			form.find('input[name=biastype]:checked').prop('value') == 'voltage' ? 'V' : 'A'
		);
	});


	module.ready();
	
}) ( );