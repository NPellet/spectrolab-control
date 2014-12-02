
var moduleProto = require('../../module'),
	extend = require('extend');

var KeithleyConnect = function() {
	this.title = "Keithley Connection";
};

KeithleyConnect.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		var module = this;
		
		this.keithley = keithley;

		this.keithley.on("connected", function() {

			module.streamOut( "connected" );
			module.emit("connected");

			module.unlock();
		} );

		this.keithley.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.emit("disconnected");
		});



		return this;
	},

	streamIn: function( message ) {

		var module = this;

		
		switch( message ) {

			case 'connect':

				module.streamOut( "pending", true );
				module.lock();
				module.keithley.connect();

			break;

			case 'disconnect':

				module.lock();
				module.streamOut( "pending", true );
				module.keithley.disconnect();
			break;
		}
	}
});

exports = module.exports = {
	Constructor: KeithleyConnect
}