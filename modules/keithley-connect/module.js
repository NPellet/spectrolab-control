
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
				module.lock();

				module.keithley.connect( function() {

					module.streamOut( "connected" );
					module.emit("connected");

					module.unlock();
				} );
			break;

			case 'disconnect':

				module.lock();
				module.streamOut( "pending", true );

				module.keithley.disconnect( function() {

					module.unlock();
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