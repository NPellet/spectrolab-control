
var ModuleProto = require('../../../module'),
	extend = require('extend');

var ButtonDisplay = function() {};

ButtonDisplay.prototype = new ModuleProto();
ButtonDisplay.prototype = extend( ButtonDisplay.prototype, {

	streamOn: {

		'click': function( ) {
			this.emit( "clicked" );
		}
	},

	setText: function( text ) {

		this.text = text;
		this.out( "setText", text );
		return this;
	},

	_getModuleInfos: function() {

		return {
			module: {
				buttonValue: this.text
			}
		};
	},

	getStatus: function() {

			return {
				buttonValue: this.text
			}

	}
	

} );

exports = module.exports = {
	Constructor: ButtonDisplay
}
