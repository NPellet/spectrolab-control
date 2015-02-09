
( function( stream ) {
	
	var button = $("#btn-{{ module.id }}");
		
	button.on('click', function() {

		module.out('click');
	});

	module.ready();

}) ( window.io );