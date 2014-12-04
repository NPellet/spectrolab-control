
var moduleProto = require('../../../module'),
	extend = require('extend');

var GraphDisplay = function() {};

GraphDisplay.prototype = extend( {}, moduleProto, {

	newSerie: function( name, data, options ) {

		this.streamOut( "newSerie", { name: name, data: data, options: options }  );
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