
var moduleProto = require('../graph/module'),
	extend = require('extend'),
	color = require("color");

var IV = function( graphOptions ) {

	this.out("makeGraph", graphOptions );

	this.status = {};
	this.status.xAxisLabel = "Voltage (V)";
	this.status.yAxisLabel = "Current (mA)";
	this.status.height = 300;

	this.series = {};
	this.ivs = {};
	this.ivsNumber = 0;
};

IV.prototype = new moduleProto.Constructor();
IV.prototype = extend( IV.prototype, {

	setIV: function( name, iv ) {

		if( ! this.ivs[ name ] ) {
			this.ivs[ name ] = iv;
			this.ivsNumber++;
		}

		this.doivs();
	},

	doivs: function() {

		var c = color().hsl( 90, 100, 35 );

		for( var i in this.ivs ) {
			var iv;
			if( iv = this.ivs[ i ].getIV() ) {
				this.newSerie( i, iv, { lineColor: c.rgbString() } )
			}

			c.rotate( 270 / this.ivsNumber );
		}

		this.autoscale();
		this.redraw();
	},

	clear: function(  ) {
		this.ivs = {};
		this.ivsNumber = 0;
		this.series = {};
		this.out( "clear" );
		return this;
	}
} );

exports = module.exports = {
	Constructor: IV,
	dependencies: [ 'display/graph' ]
}
