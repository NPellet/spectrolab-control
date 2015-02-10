
( function( stream ) {
	
	var button = $("#btn-{{ module.id }}");
		
	button.on('click', function() {

		module.out('click');
	});


	module.onMessage("setText", function( text ) {
		button.attr('value', text );
	});

	module.ready();

}) ( window.io );