
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

		this.status.text = text;
		this.out( "setText", this.status.text );
		return this;
	},

	setColor: function( color ) {

		this.status.color = color;
		this.out("setColor", this.status.color );
		return this;
	},

	_getModuleInfos: function() {

		return {
			module: {
				buttonValue: this.status.text
			}
		};
	},

	getStatus: function() {
		return this.status;
	}

} );

exports = module.exports = {
	Constructor: ButtonDisplay
}
