
var moduleProto = require('../../../../module'),
	extend = require('extend');

var ArduinoConnect = function() {
	this.title = "Arduino";
	this.status = {};
};

ArduinoConnect.prototype = new moduleProto();
ArduinoConnect.prototype = extend( ArduinoConnect.prototype, {

	assignInstrument: function( arduino ) {

		var module = this;

		this.arduino = arduino;

		this.arduino.on("connecting", function() {

			module.streamOut("connecting");
			module.emit("connecting");
			module.status = "connecting";
		} );

		this.arduino.on("connected", function() {

			module.streamOut( "connected" );
			module.emit("connected");
			module.status = "connected";

			module.unlock();
		} );

		this.arduino.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.emit("disconnected");
			module.status = "disconnected";
		});

		this.arduino.on( "connectionerror", function() {

			module.unlock();
			module.emit("connectionerror");
			module.status = "error";
			module.streamOut("connectionerror");
		});


		return this;
	},


	assignStatus: function( status ) {

		this.on("connecting", function() {
			status.update("Connecting to Arduino...", 'process');
		})
		.on('connected', function() {
			status.update("Connected to Arduino...", 'ok');
			//module( "poling" ).unlock( 'smu.connection' ); // Unlock voc stab module
		})
		.on('disconnected', function() {
			status.update("Disconnected from Arduino", 'neutral');
			//module( 'poling' ).lock( 'smu.connection' ); // Unlock voc stab module
		})
		.on("connectionerror", function() {
			status.update("Error while connecting to the Arduino", 'error');
			//module( 'poling' ).unlock( 'smu.connection' ); // Unlock voc stab module
		});
	},


	streamOn: {

		'connect': function( ) {

			var module = this;
			module.streamOut( "pending", true );
			module.emit("connecting");
			module.lock();
			module.arduino.connect();
		},

		'reset': function() {
			var module = this;
			module.arduino.reset();
		},

		'disconnected': function() {

			var module = this;
			module.lock();
			module.emit("disconnecting");
			module.streamOut( "pending", true );
			module.arduino.disconnect();
		}
	},


	getStatus: function() {
		return this.status;
	},

});

exports = module.exports = {
	Constructor: ArduinoConnect
}
