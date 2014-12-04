
( function( stream, store ) {

	var graphi;

	$( document ).ready( function() {

		var dom = $("#graph-{{ module.id }}");
		graphi = new Graph( "graph-{{ module.id }}" );
		graphi.setSize( dom.width(), dom.height() );

		graphi.on('newSerie', function( serie ) {
			stream.write( "{{ module.id }}", "newSerie", [ serie.getName(), serie.getLabel(), serie.getSymbolForLegend.toString() ] );
		} );

		stream.write("{{ module.id }}", { method: "graphStored", value: store.store( graphi ) }  );
//		graphi.getXAxis().toggleGrids( false ).setLabel('Voltage (V)');
//		graphi.getYAxis().toggleGrids( false ).flip( true ).setLabel('Current (mA)').setLineAt0( true );

		module.ready();
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

			case 'setHeight':
				graphi.setHeight( data.value );
			break;

			case 'clear':
				graphi.killSeries();
			break;

		}
	} );

	

}) ( window.io, window.storage );