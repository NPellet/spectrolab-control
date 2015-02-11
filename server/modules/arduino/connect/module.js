
var moduleProto = require('../../../module'),
	extend = require('extend');

var ArduinoConnect = function() {
	this.title = "Arduino Connection";
	this.status = {};
};

ArduinoConnect.prototype = new moduleProto();
ArduinoConnect.prototype = extend( ArduinoConnect.prototype, {

	assignArduino: function( arduino ) {

		var module = this;
		
		this.arduino = arduino;

		this.arduino.on("connecting", function() {

			module.streamOut("connecting");
			module.emit("connecting");

			module.status.connected = false;
			module.status.connecting = true;
			module.status.error = false;
		} );

		this.arduino.on("connected", function() {

			module.streamOut( "connected" );
			module.emit("connected");

			module.status.connected = true;
			module.status.connecting = false;
			module.status.error = false;

			module.unlock();
		} );

		this.arduino.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.emit("disconnected");

			module.status.connected = false;
			module.status.error = false;
			module.status.connecting = false;
		});

		this.arduino.on( "connectionerror", function() {

			module.unlock();
			module.emit("connectionerror");

			module.status.connected = false;
			module.status.error = true;
			module.status.connecting = false;

			module.streamOut("error");
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