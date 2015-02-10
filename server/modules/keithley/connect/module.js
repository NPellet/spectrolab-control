
var moduleProto = require('../../../module'),
	extend = require('extend');

var KeithleyConnect = function() {
	this.title = "Keithley Connection";
};


KeithleyConnect.prototype = new moduleProto();
KeithleyConnect.prototype = extend( KeithleyConnect.prototype, {


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

		this.keithley.on( "connectionerror", function() {

			module.unlock();
			module.emit("connectionerror");
		})


		return this;
	},


	assignStatus: function( status ) {

		this.on("connecting", function() {
			status.update("Connecting to Keithley SMU...", 'process');
		})
		.on('connected', function() {
			status.update("Connected to Keithley SMU", 'ok');
			//module( "poling" ).unlock( 'smu.connection' ); // Unlock voc stab module
		})
		.on('disconnected', function() {
			status.update("Disconnected from Keithley SMU", 'neutral');
			//module( 'poling' ).lock( 'smu.connection' ); // Unlock voc stab module	
		})
		.on("connectionerror", function() {
			status.update("Error while connecting to the keithley", 'error');
			//module( 'poling' ).unlock( 'smu.connection' ); // Unlock voc stab module	
		});
	},


	streamOn: {

		'connect': function( ) {
	
			var module = this;
			module.streamOut( "pending", true );
			module.emit("connecting");
			module.lock();
			module.keithley.connect();
		},

		'disconnected': function() {

			var module = this;
			module.lock();
			module.emit("disconnecting");
			module.streamOut( "pending", true );
			module.keithley.disconnect();
		}
	}

});

exports = module.exports = {
	Constructor: KeithleyConnect
}