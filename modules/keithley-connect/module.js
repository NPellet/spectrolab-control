
var moduleProto = require('../../module'),
	extend = require('extend');

var KeithleyConnect = function() {};

KeithleyConnect.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;
	},

	streamIn: function( message ) {

		var module = this;

		switch( message ) {

			case 'connect':

				module.streamOut( "pending" );

				module.keithley.connect( function() {

					module.streamOut( "connected" );
				} );
			break;

			case 'disconnect':

				module.streamOut( "pending" );

				module.keithley.disconnect( function() {

					module.streamOut( "disconnected" );
				});
				
			break;
		}
	}

});

exports = module.exports = {
	Constructor: KeithleyConnect
}