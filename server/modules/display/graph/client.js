

define( [ 'client/js/module', 'jsgraph'], function( defaultModule, Graph ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {
			
	}

	module.prototype.checkGraph = function() {

		if( this.graph ) {
			return this.graph;
		} else {

			this.makeGraph();
			return this.graph;
		}
	}

	module.prototype.makeGraph = function( options ) {

		var dom = $("#graph-" + this.getId() );
		g = new Graph( "graph-" + this.getId() );
		g.setSize( dom.width(), dom.height() );

		this.graph = g;
	}

	module.prototype.newSerie = function( data, type ) {

		var g = this.checkGraph();
		if( serie = g.getSerie( data.name ) ) {
			serie.setData( data.data );
			serie.options = data.options;

			switch( type ) {

				case 'scatter':
					serie.setDataError( data.errors );
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

					serie.on( "mouseover", function( id ) {
						module.streamOut("mouseOverPoint", { serieName: data.name, pointId: id } );
					});


				break;
			}
		}

		g.redraw();
		g.drawSeries();
	}

	module.prototype.in = {

		"makeGraph": function( options ) {

			this.makeGraph( options );
			//this.out( "graphstored", store.store( g ) );
		},

		"autoscale": function() {

			var g = this.checkGraph();
			
			g.autoscaleAxes();
			g.redraw();
			g.drawSeries();
		},

		"newSerie": function( data ) {

			var g = this.checkGraph();

			this.newSerie( data, 'line' );
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

		"setXAxisLabel": function ( data ) {

			var g = this.checkGraph();
			g.getXAxis().setLabel( data.value );
		},


		"setYAxisLabel": function ( data ) {

			var g = this.checkGraph();
			g.getYAxis().setLabel( data.value );
		},

		"setHeight": function ( data ) {

			var g = this.checkGraph();
			g.setHeight( value );
		},

		"clear": function ( data ) {

			var g = this.checkGraph();
			g.killSeries();
		},

		"redraw": function ( data ) {

			var g = this.checkGraph();
			g.redraw();
			g.drawSeries();
		}
	};

	module.prototype.setStatus = function( status ) {

		var g = this.checkGraph();
		var self = this;

		if( status.height ) {
			g.setHeight( status.height );
		}

		if( status.xLabel ) {
			g.getXAxis().setLabel( xLabel );
		}

		if( status.yLabel ) {
			g.getYAxis().setLabel( yLabel );
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
