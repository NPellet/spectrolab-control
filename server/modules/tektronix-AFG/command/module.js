
var moduleProto = require('../../../module'),
	extend = require('extend');

var AFGCommand = function() {
	this.title = "AFG Connection";
	this.status = {};
};


AFGCommand.prototype = new moduleProto();
AFGCommand.prototype = extend( AFGCommand.prototype, {


	assignAFG: function( afg ) {

		var module = this;
		this.afg = afg;
		return this;
	},

	streamOn: {

		'command': function( query ) {
			var module = this;

			this.status.query = query;
			this.status.response = "";

			this.afg.command( query ).then( function( data ) {
				
				module.status.response = data;
				module.streamOut("response", data );

			} );
		}
	},

	getStatus: function() {
		return this.status;
	}

});

exports = module.exports = {
	Constructor: AFGCommand
}
