
var moduleProto = require('../../../module'),
	extend = require('extend');

var GraphDisplay = function( graphOptions ) {

	this.streamOut("makeGraph", graphOptions );
	this.series = {};
};

function waveToData( data ) {

	if( data.getData ) {
		var data2 = [];
		var dataY = data.getData();

		for( var i = 0; i < dataY.length; i ++ ) {
			data2.push( data.getXScaling().x0 + data.getXScaling().xDelta * i );
			data2.push( dataY[ i ] );
		}

		data = data2;
	}

	return data;
}

GraphDisplay.prototype = new moduleProto();
GraphDisplay.prototype = extend( GraphDisplay.prototype, {

	newSerie: function( name, data, options ) {

		data = waveToData( data );
		var s = { name: name, data: data, options: options };
		this.series[ name ] = s;

		this.streamOut( "newSerie", s );
		return this;
	},

	newScatterSerie: function( name, data, options, errors ) {

		data = waveToData( data );
		var s = { name: name, data: data, options: options, errors: errors };
		this.series[ name ] = s;

		
		this.streamOut( "newScatterSerie", s );
		return this;
	},

	setXLogScale: function( bln ) {
		this.streamOut( "setXLogScale", { bln: bln } );
		return this;
	},

	setYLogScale: function( bln ) {
		this.streamOut( "setYLogScale", { bln: bln } );
		return this;
	},

	forceXMin: function( val ) {
		this.streamOut( "forceXMin", val );
		return this;	
	},

	forceXMax: function( val ) {
		this.streamOut( "forceXMax", val );
		return this;	
	},

	forceYMin: function( val ) {
		this.streamOut( "forceYMin", val );
		return this;	
	},

	forceYMax: function( val ) {
		this.streamOut( "forceYMax", val );
		return this;	
	},

	autoscale: function() {
		this.streamOut( "autoscale" );
		return this;
	},

	clear: function(  ) {

		this.streamOut( "clear" );
		return this;
	},

	setXAxisLabel: function( label ) {

		this.streamOut( "setXAxisLabel", label );
		return this;
	},

	setYAxisLabel: function( label ) {

		this.streamOut( "setYAxisLabel", label );
		return this;
	},

	setHeight: function( h ) {
		this.streamOut( "setHeight", h );
	},

	assign: function( module, message ) {

		switch( message ) {

			case "legend":

				this.on("graphStored", function( id ) {

					module.assignGraph( id );

				});
			
			break;
		}

	},

	streamOn: {

		'graphstored': function( v, i ) {
	
			this._graphClientStoreId = v;
			this.emit( "graphStored", this._graphClientStoreId );

		},

		'mouseOverPoint': function( data ) {

			this.emit("mouseOverPoint", data.serieName, data.pointId );
		}
	}

} );

exports = module.exports = {
	Constructor: GraphDisplay
}