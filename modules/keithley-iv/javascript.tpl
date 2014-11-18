
( function( stream ) {

	$("#module-{{ module.id }} .channel").toggles({text:{on:'Chan A',off:'Chan B'}});



	var button = $( "#measure-{{ module.id }}" )

	button.on( 'click', function() {

		stream.write( "{{ module.id }}", { method: "sweep", value: 

			{ 	
				channel: $("#channel-{{ module.id }}").prop('value'),
				startV: parseFloat( $("#vstart-{{ module.id }}").prop('value') ),
				stopV: parseFloat( $("#vstop-{{ module.id }}").prop('value') ),
				scanspeed: parseFloat( $("#scanspeed-{{ module.id }}").prop('value') ),
				step: parseFloat( $("#step-{{ module.id }}").prop('value') ),
				timeDelay: parseFloat( $("#tdelay-{{ module.id }}").prop('value') ),
				complianceI: parseFloat( $("#icompliance-{{ module.id }}").prop('value') ),
			}

		} );

	} ); 


	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.method ) {

		}
	})

}) ( window.io );