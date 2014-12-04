
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

	streamIn: function( message ) {

		var module = this;

		if( message.method ) {

			switch( message.method ) {

				case 'graphStored':

				console.log("Storeid: ", message );


					this._graphClientStoreId = message.value;
					this.emit( "graphStored", this._graphClientStoreId );
				break;

			}
		}

	}

} );

exports = module.exports = {
	Constructor: GraphDisplay
}