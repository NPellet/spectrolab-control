
var moduleProto = require('../../../module'),
	extend = require('extend');

var ButtonDisplay = function() {};

ButtonDisplay.prototype = extend( {}, moduleProto, {


	streamOn: {

		'click': function( ) {

			this.emit( "clicked" );
		}
	},


	setText: function( text ) {

		this.text = text;
		return this;
	},


	_getModuleInfos: function() {
		
		return {

			module: {

				buttonValue: this.text
			}
		};
	},

} );

exports = module.exports = {
	Constructor: ButtonDisplay
}