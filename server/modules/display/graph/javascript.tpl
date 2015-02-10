
( function( store ) {

	var graphi;

	$( document ).ready( function() {

		
		module.ready();
	});
	
	module.onMessage( "makeGraph", function() {
		
		var dom = $("#graph-{{ module.id }}");
		graphi = new Graph( "graph-{{ module.id }}" );
		graphi.setSize( dom.width(), dom.height() );

		module.streamOut( "graphstored", store.store( graphi ) );
	});

	module.onMessage( "autoscale", function() {

		if( ! graphi ) {
			return;
		}

		graphi.autoscaleAxes();
		graphi.redraw();
		graphi.drawSeries();
	});

	module.onMessage( "newSerie", function( data ) {

		if( ! graphi ) {
			return;
		}
		
		if( serie = graphi.getSerie( data.name ) ) {
			serie.setData( data.data );
			serie.options = data.options;
			graphi.redraw();
			graphi.drawSeries();
			return;
		}

		// Create a serie
		var s = graphi
			.newSerie( data.name, data.options )
			.autoAxis()
			.setData( data.data );

		graphi.redraw();
		graphi.drawSeries();
	});


	module.onMessage( "newScatterSerie", function( data ) {


		if( ! graphi ) {
			return;
		}
		


		if( serie = graphi.getSerie( data.name ) ) {
			serie.setData( data.data );
			serie.setDataError( data.errors );
			serie.options = data.options;
			graphi.redraw();
			graphi.drawSeries();
			return;
		}


		// Create a serie
		var s = graphi
			.newSerie( data.name, data.options, "scatter" )
			.autoAxis()
			.setData( data.data )
			.setDataError( data.errors )
			.setErrorStyle( [ 'bar'] );

		s.on( "mouseover", function( id ) {
			module.streamOut("mouseOverPoint", { serieName: data.name, pointId: id } );
		});

		graphi.redraw();
		graphi.drawSeries();
	});
	

	module.onMessage("setXLogScale", function( data ) {


		if( ! graphi ) {
			return;
		}
		
		graphi.getXAxis().options.logScale = data.bln;
		graphi.redraw();
		graphi.drawSeries();
	});


	module.onMessage("setYLogScale", function( data ) {


		if( ! graphi ) {
			return;
		}
		
		graphi.getYAxis().options.logScale = data.bln;
		graphi.redraw();
		graphi.drawSeries();
	});


	module.onMessage( "forceXMin", function( data ) {

		if( ! graphi ) {
			return;
		}
		
		graphi.getXAxis().forceMin( data );
	});

	module.onMessage( "forceXMax", function( data ) {

		if( ! graphi ) {
			return;
		}
		
		graphi.getXAxis().forceMax( data );
	});

	module.onMessage( "forceYMin", function( data ) {

		if( ! graphi ) {
			return;
		}
		
		graphi.getYAxis().forceMin( data );
	});

	module.onMessage( "forceYMax", function( data ) {

		if( ! graphi ) {
			return;
		}
		
		graphi.getYAxis().forceMax( data );
	});

	module.onMessage( "setXAxisLabel", function( data ) {

		if( ! graphi ) {
			return;
		}
		
		graphi.getXAxis().setLabel( data.value );
	});

	module.onMessage( "setYAxisLabel", function( data ) {

		if( ! graphi ) {
			return;
		}
		
		graphi.getYAxis().setLabel( data.value );
	});

	module.onMessage( "setHeight", function( value ) {

		if( ! graphi ) {
			return;
		}
		
		graphi.setHeight( value );
	});

	module.onMessage( "clear", function( data ) {

		if( ! graphi ) {
			return;
		}
		
		graphi.killSeries();
	});

}) ( window.storage );