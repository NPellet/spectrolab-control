
var moduleProto = require('../../../module'),
	extend = require('extend');

var GraphDisplay = function( graphOptions ) {

	this.streamOut("makeGraph", graphOptions );
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

GraphDisplay.prototype = extend( {}, moduleProto, {

	newSerie: function( name, data, options ) {

		data = waveToData( data );
		this.streamOut( "newSerie", { name: name, data: data, options: options }  );
		return this;
	},

	newScatterSerie: function( name, data, options, errors ) {
		data = waveToData( data );
		this.streamOut( "newScatterSerie", { name: name, data: data, options: options, errors: errors }  );
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

		}
	}

} );

exports = module.exports = {
	Constructor: GraphDisplay
}