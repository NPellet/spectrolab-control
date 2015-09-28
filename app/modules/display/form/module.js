
var ModuleProto = require('../../../module'),
	extend = require('extend');

var ButtonDisplay = function() {};

ButtonDisplay.prototype = new ModuleProto();
ButtonDisplay.prototype = extend( ButtonDisplay.prototype, {

	streamOn: {

		'formValue': function( value ) {
			this.emit( "validated", value );
		},
	},

	setData: function( data ) {

		this.status.data = data;
		this.out( "setData", this.status.data );
		return this;
	},

	setSchema: function( schema ) {

		this.status.schema = schema;
		this.out("setSchema", this.status.schema );
		return this;
	},


	setOptions: function( options ) {

		this.status.options = options;

		this.out("setOptions", this.status.options );
		return this;
	},

	getStatus: function() {

		return this.status;
	}

} );

exports = module.exports = {
	Constructor: ButtonDisplay
}
