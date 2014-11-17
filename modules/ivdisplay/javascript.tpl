
( function( stream ) {

	var graphi;

	$( document ).ready( function() {

		var dom = $("#iv-{{ module.id }}");
		graphi = new Graph( "iv-{{ module.id }}" );
		graphi.setSize( dom.width(), dom.height() );

		graphi.getXAxis().toggleGrids( false ).setLabel('Voltage (V)');
		graphi.getYAxis().toggleGrids( false ).flip( true ).setLabel('Current (mA)').setLineAt0( true );
	});
	
	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.message ) {

			case 'iv':

				// Create a serie
			
				var s = graphi.newSerie("someserie").autoAxis().setData( data.value );
			
				graphi.redraw();
				graphi.drawSeries();

			break;
		}
		

	})

}) ( window.io );