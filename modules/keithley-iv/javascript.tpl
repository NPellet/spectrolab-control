
( function( stream ) {

	var button = $( "#measure-{{ module.id }}" )

	button.on( 'click', function() {

		stream.write( "{{ module.id }}", { method: "sweep", value: 

			{ 	
				channel: $("#channel-{{ module.id }}").prop('value'),
				startV: $("#vstart-{{ module.id }}").prop('value'),
				stopV: $("#vstop-{{ module.id }}").prop('value'),
				scanspeed: $("#scanspeed-{{ module.id }}").prop('value'),
				step: $("#step-{{ module.id }}").prop('value'),
				timeDelay: $("#tdelay-{{ module.id }}").prop('value'),
				complianceI: $("#icompliance-{{ module.id }}").prop('value'),
			}

		} );

	} ); 


	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.method ) {

		}
	})

}) ( window.io );