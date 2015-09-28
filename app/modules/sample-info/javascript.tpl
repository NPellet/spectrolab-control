
( function( stream ) {

	//$("#module-{{ module.id }} .channel").toggles({text:{on:'Chan A',off:'Chan B'}});


	var form = $( "#form-{{ module.id }}" )

	form.on( 'change, keyup', 'input', function() {
		var data = serializeObjectWithFloats( form, [] );
		module.out( "change", data );
	} ); 


	module.ready();

}) ( window.io );