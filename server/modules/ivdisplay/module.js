
var moduleProto = require('../../module'),
	extend = require('extend');

var IVDisplay = function() {};

IVDisplay.prototype = extend( {}, moduleProto, {

	setIV: function( type, direction, iv ) {

		this.streamOut( "iv", iv );

	},

});

exports = module.exports = {
	Constructor: IVDisplay
}