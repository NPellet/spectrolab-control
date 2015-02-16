
var moduleProto = require('../../../../module'),
	extend = require('extend');

var GouldConnect = function() {
	this.title = "Gould Connection";
	this.status = {};
};

GouldConnect.prototype = new moduleProto();
GouldConnect.prototype = extend( GouldConnect.prototype, {

	assignInstrument: function( gould ) {

		var module = this;

		this.gould = gould;

		this.gould.on("connecting", function() {

			module.streamOut("connecting");
			module.emit("connecting");

			module.status.connected = false;
			module.status.connecting = true;
			module.status.error = false;
		} );

		this.gould.on("connected", function() {

			module.streamOut( "connected" );
			module.emit("connected");

			module.status.connected = true;
			module.status.connecting = false;
			module.status.error = false;

			module.unlock();
		} );

		this.gould.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.emit("disconnected");

			module.status.connected = false;
			module.status.error = false;
			module.status.connecting = false;
		});

		this.gould.on( "connectionerror", function() {

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
			status.update("Connecting to Gould Oscilloscope...", 'process');
		})
		.on('connected', function() {
			status.update("Connected to Gould Oscilloscope...", 'ok');
			//module( "poling" ).unlock( 'smu.connection' ); // Unlock voc stab module
		})
		.on('disconnected', function() {
			status.update("Disconnected from Gould Oscilloscope", 'neutral');
			//module( 'poling' ).lock( 'smu.connection' ); // Unlock voc stab module
		})
		.on("connectionerror", function() {
			status.update("Error while connecting to the Gould Oscilloscope", 'error');
			//module( 'poling' ).unlock( 'smu.connection' ); // Unlock voc stab module
		});
	},


	streamOn: {

		'connect': function( ) {

			var module = this;
			module.streamOut( "pending", true );
			module.emit("connecting");
			module.lock();
			module.gould.connect();
		},

		'reset': function() {
			var module = this;
			module.gould.reset();
		},

		'disconnected': function() {

			var module = this;
			module.lock();
			module.emit("disconnecting");
			module.streamOut( "pending", true );
			module.gould.disconnect();
		}
	},


	getStatus: function() {
		return this.status;
	},

});

exports = module.exports = {
	Constructor: GouldConnect
}
