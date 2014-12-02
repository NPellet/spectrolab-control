
( function( stream ) {

	var graphi;

	$( document ).ready( function() {

		var dom = $("#graph-{{ module.id }}");
		graphi = new Graph( "graph-{{ module.id }}" );
		graphi.setSize( dom.width(), dom.height() );

//		graphi.getXAxis().toggleGrids( false ).setLabel('Voltage (V)');
//		graphi.getYAxis().toggleGrids( false ).flip( true ).setLabel('Current (mA)').setLineAt0( true );
	});
	
	stream.onMessage( "{{ module.id }}", function( data ) {

		switch( data.method ) {

			case 'newSerie':

				// Create a serie
			
				var s = graphi
							.newSerie( data.value.name )
							.autoAxis()
							.setData( data.value.data );

				graphi.redraw();
				graphi.drawSeries();

			break;

			case 'setXAxisLabel':
				graphi.getXAxis().setLabel( data.value );
			break;

			case 'setYAxisLabel':
				graphi.getYAxis().setLabel( data.value );
			break;

			case 'clear':
				graphi.killSeries();
			break;

		}
	} );

}) ( window.io );