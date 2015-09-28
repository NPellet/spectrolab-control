
var moduleProto = require('../../../module'),
	extend = require('extend');

var GraphDisplay = function() {};

GraphDisplay.prototype = extend( {}, moduleProto, {

	addColumn: function( columnName ) {
		this.streamOut( "addColumn", columnName );
		return this;
	},

	addRow: function( data ) {
		this.streamOut( "addRow", data );
		return this;
	}

} );

exports = module.exports = {
	Constructor: GraphDisplay
}