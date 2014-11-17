
var moduleProto = require('../../module'),
	extend = require('extend');

var IVDisplay = function() {};

IVDisplay.prototype = extend( {}, moduleProto, {

	setIV: function( iv ) {

		this.streamOut( { message: 'iv', value: iv } );

	},

});

exports = module.exports = {
	Constructor: IVDisplay
}