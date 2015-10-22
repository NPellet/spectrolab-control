
var moduleProto = require('../../../module'),
	extend = require('extend');

var GraphDisplay = function( graphOptions ) {

	this.options = graphOptions;
	this.series = {};
};

function waveToData( data ) {

	if( data.getData ) {
		var data2 = [];
		var dataY = data.getData();
		var dataX = data.getXWave().getData();

		for( var i = 0; i < dataY.length; i ++ ) {


			data2.push( dataX[ i ] );
			data2.push( dataY[ i ] );
		}

		data = data2;
	}

	return data;
}

GraphDisplay.prototype = new moduleProto();
GraphDisplay.prototype = extend( GraphDisplay.prototype, {

	inDom: function( ws ) {

		this.out("makeGraph", this.options, ws ); // Here we need to send it to a single connection
	},

	newSerie: function( name, data, options ) {

		data = waveToData( data );
		var s = { name: name, data: data, options: options };
		this.series[ name ] = s;

		this.status.series = this.status.series || {};
		this.status.series[ name ] = s;

		this.out( "newSerie", s );
		return this;
	},

	getSerie: function( name ) {
		return this.series[ name ];
	},

	updateSerie: function( name ) {
		this.out( "updateSerie", this.series[ name ] );
	},

	newScatterSerie: function( name, data, options, errors, style ) {

		data = waveToData( data );
		var s = { name: name, data: data, options: options, errors: errors, style: style };
		this.series[ name ] = s;

		this.status.scatterSeries = this.status.scatterSeries || {};
		this.status.scatterSeries[ name ] = s;

		this.out( "newScatterSerie", s );
		return this;
	},


	setXLogScale: function( bln ) {
		this.status.xLogScale = bln;
		this.out( "setXLogScale", { bln: bln } );
		return this;
	},

	setYLogScale: function( bln ) {
		this.status.yLogScale = bln;
		this.out( "setYLogScale", { bln: bln } );
		return this;
	},

	forceXMin: function( val ) {
		this.status.forceXMin = val;
		this.out( "forceXMin", val );
		return this;
	},

	forceXMax: function( val ) {
		this.status.forceXMax = val;
		this.out( "forceXMax", val );
		return this;
	},

	forceYMin: function( val ) {
		this.status.forceYMin = val;
		this.out( "forceYMin", val );
		return this;
	},

	forceYMax: function( val ) {
		this.status.forceYMax = val;
		this.out( "forceYMax", val );
		return this;
	},

	autoscale: function() {
		this.out( "autoscale" );
		return this;
	},

	forceXScale: function( from, to ) {
		this.status.xScale = [ from, to ];
		this.out("forceXScale", [ from, to ] );
		return this;
	},

	clear: function(  ) {

		this.out( "clear" );
		return this;
	},

	setYAxisLabel: function( label ) {
		this.status.yAxisLabel = label;
		this.out( "setYAxisLabel", label );
		return this;
	},


	setXAxisLabel: function( label ) {
		this.status.xAxisLabel = label;
		this.out( "setXAxisLabel", label );
		return this;
	},

	setXScientificTicks: function( bln ) {
		this.status.xScientificTicks = bln;
		this.out( "setXScientificTicks", bln );
		return this;
	},
	setYScientificTicks: function( bln ) {
		this.status.yScientificTicks = bln;
		this.out( "setYScientificTicks", bln );
		return this;
	},

	setXUnit: function( unit ) {
		this.status.xUnit = unit;
		this.out( "setXUnit", unit );
		return this;
	},

	setYUnit: function( unit ) {
		this.status.yUnit = unit;
		this.out( "setYUnit", unit );
		return this;
	},

	redraw: function() {
		this.out("redraw");
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


	getStatus: function() {

		console.log( this.status );
		return this.status;
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
