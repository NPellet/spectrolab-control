
var moduleProto = require('../../../module'),
	extend = require('extend');

var GraphDisplay = function() {};

GraphDisplay.prototype = extend( {}, moduleProto, {

	
	assignGraph: function( graphStoreId ) {


		this.streamOut( "assignGraph", graphStoreId );
	}

} );

exports = module.exports = {
	Constructor: GraphDisplay
}