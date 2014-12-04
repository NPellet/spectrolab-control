
( function( store ) {

	var graphi;

	$( document ).ready( function() {

		var dom = $("#graph-{{ module.id }}");
		graphi = new Graph( "graph-{{ module.id }}" );
		graphi.setSize( dom.width(), dom.height() );

		module.streamOut( "graphstored", store.store( graphi ) );
		
//		graphi.getXAxis().toggleGrids( false ).setLabel('Voltage (V)');
//		graphi.getYAxis().toggleGrids( false ).flip( true ).setLabel('Current (mA)').setLineAt0( true );

		module.ready();
	});
	
	module.onMessage( "newSerie", function( data ) {

		// Create a serie
		var s = graphi
			.newSerie( data.name )
			.autoAxis()
			.setData( data.data );

		graphi.redraw();
		graphi.drawSeries();
	});
	
	module.onMessage( "setXAxisLabel", function( data ) {
		graphi.getXAxis().setLabel( data.value );
	});

	module.onMessage( "setYAxisLabel", function( data ) {
		graphi.getYAxis().setLabel( data.value );
	});

	module.onMessage( "setHeight", function( value ) {
		graphi.setHeight( value );
	});

	module.onMessage( "clear", function( data ) {
		graphi.killSeries();
	});

}) ( window.storage );