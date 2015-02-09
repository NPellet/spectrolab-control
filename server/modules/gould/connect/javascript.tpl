
( function( stream ) {

	var connect = $( "#connect-{{ module.id }}" )
	var reset = $( "#reset-{{ module.id }}" )

	connect.on( 'click', function() {
		module.out( "connect" );
	} ); 


	reset.on( 'click', function() {
		module.out( "reset" );
	} ); 

	module.onMessage( "connected", function() {

		connect.addClass('connected');
		connect.prop( 'value', 'Disconnect' );

	});
	
	module.onMessage( "disconnected", function() {

		connect.prop( 'value', 'Connect' );
		connect.removeClass('connected');
	});
	
	module.ready();
	
}) ( window.io );