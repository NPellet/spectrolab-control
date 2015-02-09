
( function( stream ) {

	var button = $( "#{{ module.id }}" )

	button.on( 'click', function() {

		module.out( "connect" );
	} ); 

	module.onMessage( "connected", function() {

		button.addClass('connected');
		button.prop( 'value', 'Disconnect' );

	});
	
	module.onMessage( "disconnected", function() {

		button.prop( 'value', 'Connect' );
		button.removeClass('connected');
	});
	
	module.ready();
	
}) ( window.io );