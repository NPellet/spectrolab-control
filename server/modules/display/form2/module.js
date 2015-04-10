
var moduleProto = require('../../../module'),
	extend = require('extend');

var FormDisplay = function(  ) { };


FormDisplay.prototype = new moduleProto();
FormDisplay.prototype = extend( FormDisplay.prototype, {

	getStatus: function() {
		return this.status;
	},

	setFormData: function( data ) {
		this.status.formData = data;
		this.streamOut("formData", data )
	},

	setFormHtml: function( data ) {
		this.status.formHtml = data;
		this.streamOut("formHtml", data )
	},

	streamOn: {

		'submitClicked': function( data ) {

			this.emit( "submitClicked", data );

		}
	}

} );

exports = module.exports = {
	Constructor: FormDisplay
}
