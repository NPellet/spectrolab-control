
var moduleProto = require('../../module'),
	extend = require('extend');

var KeithleyConnect = function() {};

KeithleyConnect.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;
		return this;
	},

	streamIn: function( message ) {

		var module = this;

		switch( message ) {

			case 'connect':

				module.streamOut( "pending", true );

				module.keithley.connect( function() {

					module.streamOut( "connected" );
					module.emit("connected");
				} );
			break;

			case 'disconnect':

				module.streamOut( "pending", true );

				module.keithley.disconnect( function() {

					module.streamOut( "disconnected", true );
					module.emit("disconnected");
				});
				
			break;
		}
	}
});

exports = module.exports = {
	Constructor: KeithleyConnect
}