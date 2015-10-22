

define(  [ 'js/module', 'jsgraph'], function( defaultModule, Graph ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {

	}

	module.prototype.checkGraph = function() {

		if( this.graph ) {
			return this.graph;
		}

		console.trace();
		throw "Graph does not exist";
	}

	module.prototype.makeGraph = function( options ) {

		var dom = $("#graph-" + this.getId() );
		g = new Graph( "graph-" + this.getId(), {

			dblclick: {
				type: 'plugin',
				plugin: 'zoom',
				options: {
					mode: 'total'
				}
			},

			plugins: {
				'zoom': {
					zoomMode: 'xy'
				}
			},

			pluginAction: {
				'zoom': {
					shift: false,
					ctrl: false
				}
			}
		} );


		g.setSize( dom.width(), dom.height() );

		this.graph = g;
	}

	module.prototype.newSerie = function( data, type ) {

		var module = this;
		var g = this.checkGraph();
		if( serie = g.getSerie( data.name ) ) {

			serie.setData( data.data );
			serie.setOptions( data.options );

			switch( type ) {

				case 'scatter':
					serie.setDataError( data.errors );
				//	serie.setStyle( data.style );
				break;
			}


		} else {

			// Create a serie
			var serie = g
				.newSerie( data.name, data.options, type )
				.autoAxis()
				.setData( data.data );

			switch( type ) {

				case 'scatter':

					serie.setDataError( data.errors );
					serie.setErrorStyle( [ 'bar'] );
					//serie.setStyle( data.style );

					serie.on( "mouseover", function( id ) {
						module.out("mouseOverPoint", { serieName: data.name, pointId: id } );
					});

				break;
			}
		}

		g.draw();
	}

	module.prototype.in = {

		"makeGraph": function( options ) {

			this.makeGraph( options );
			//this.out( "graphstored", store.store( g ) );
		},

		"autoscale": function() {

			var g = this.checkGraph();

			g.autoscaleAxes();
			g.draw();
			
		},

		forceXScale: function( d ) {
			var g = this.checkGraph();

			g.getXAxis().zoom( d[ 0 ], d[ 1 ] );
			g.draw();
			
		},

		"newSerie": function( data ) {

			var g = this.checkGraph();

			this.newSerie( data, 'line' );
		},

		updateSerie: function( data ) {
			var g = this.checkGraph();

			var serie = g.getSerie( data.name );

			if( ! serie ) {
				return;
			}
			serie.setData( data.data );
			serie.setOptions( data.options );
		},


		"newScatterSerie": function ( data ) {

			var g = this.checkGraph();

			this.newSerie( data, 'scatter' );
		},

		"setXLogScale": function( data ) {

			var g = this.checkGraph();
			g.getXAxis().options.logScale = data.bln;
		},


		"setYLogScale": function ( data ) {

			var g = this.checkGraph();
			g.getYAxis().options.logScale = data.bln;
		},

		"forceXMin": function ( data ) {

			var g = this.checkGraph();
			g.getXAxis().forceMin( data );
		},

		"forceXMax": function ( data ) {

			var g = this.checkGraph();
			g.getXAxis().forceMax( data );
		},

		"forceYMin": function ( data ) {

			var g = this.checkGraph();
			g.getYAxis().forceMin( data );
		},

		"forceYMax": function ( data ) {

			var g = this.checkGraph();
			g.getYAxis().forceMax( data );
		},

		"setXScientificTicks": function( bln ) {
			var g = this.checkGraph();

			g.getXAxis().setScientific( bln );
			return this;
		},

		"setYScientificTicks": function( bln ) {
			var g = this.checkGraph();
			g.getLeftAxis().setScientific( bln );

			return this;
		},

		"setXAxisLabel": function ( data ) {

			var g = this.checkGraph();
			g.getXAxis().setLabel( data );
		},


		"setYAxisLabel": function ( data ) {

			var g = this.checkGraph();
			g.getYAxis().setLabel( data );
		},

	

		"clear": function ( data ) {

			var g = this.checkGraph();
			g.killSeries();
		},

		"redraw": function ( data ) {

			var g = this.checkGraph();
			g.draw();
		},

		"setXUnit": function( unit ) {

			var g = this.checkGraph();
			g.getBottomAxis().setUnit( unit );
			g.draw();
		},

		"setYUnit": function( unit ) {

			var g = this.checkGraph();
			g.getLeftAxis().setUnit( unit );
			g.draw();
		}
	};

	module.prototype.setStatus = function( status ) {

		var g = this.checkGraph();
		var self = this;

		
		g.setHeight( this.getDom().height() - this.getDom().children( 0 ).height() - 50 );
		

		if( status.xScale ) {
			g.getXAxis().forceMin( status.xScale[ 0 ] ).forceMax( status.xScale[ 1 ]);
		}

		if( status.xAxisLabel ) {
			g.getXAxis().setLabel( status.xAxisLabel );
		}

		if( status.yAxisLabel ) {
			g.getYAxis().setLabel( status.yAxisLabel );
		}

		if( status.forceYMin !== undefined ) {
			g.getYAxis().forceMin( status.forceYMin );
		}

		if( status.forceYMax !== undefined ) {
			g.getYAxis().forceMax( status.forceYMax );
		}

		if( status.forceXMin !== undefined ) {
			g.getXAxis().forceMin( status.forceXMin );
		}

		if( status.forceXMax !== undefined ) {
			g.getXAxis().forceMax( status.forceXMax );
		}

		if( status.xScientificTicks !== undefined ) {
			g.getXAxis().setScientific( status.xScientificTicks );
		}

		if( status.yScientificTicks !== undefined ) {
			g.getYAxis().setScientific( status.yScientificTicks );
		}

		if( status.xUnit !== undefined ) {
			g.getXAxis().setUnit( status.xUnit );
		}

		if( status.yUnit !== undefined ) {
			g.getYAxis().setUnit( status.yUnit );
		}



		if( status.yScientificTicks !== undefined ) {
			g.getYAxis().options.scientificTicks = status.yScientificTicks;
		}


		if( status.xLogScale ) {
			g.getXAxis().options.logScale = true;
		}

		if( status.yLogScale ) {
			g.getYAxis().options.logScale = true;
		}

		if( status.series ) {

			var series = status.series;
			for( var i in series ) {
				self.newSerie( series[ i ], 'line' );
			}
		}

		if( status.scatterSeries ) {

			var series = status.scatterSeries;
			for( var i in series ) {
				self.newSerie( series[ i ], 'scatter' );
			}
		}

		g.redraw();
		g.drawSeries();
	}

	return module;

} );
