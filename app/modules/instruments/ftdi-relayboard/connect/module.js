
var moduleProto = require('../../../../module'),
	extend = require('extend');

var FTDIConnect = function() {
	this.title = "FTDI Connection";
	this.status = {};
};

FTDIConnect.prototype = new moduleProto();
FTDIConnect.prototype = extend( FTDIConnect.prototype, {

	assignInstrument: function( FTDI ) {

		var module = this;

		this.FTDI = FTDI;

		this.FTDI.on("connecting", function() {

			module.streamOut("connecting");
			module.emit("connecting");

			module.status.connected = false;
			module.status.connecting = true;
			module.status.error = false;
		} );

		this.FTDI.on("connected", function() {

			module.streamOut( "connected" );
			module.emit("connected");

			module.status.connected = true;
			module.status.connecting = false;
			module.status.error = false;

			module.unlock();
		} );

		this.FTDI.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.emit("disconnected");

			module.status.connected = false;
			module.status.error = false;
			module.status.connecting = false;
		});

		this.FTDI.on( "connectionerror", function() {

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
			status.update("Connecting to FTDI...", 'process');
		})
		.on('connected', function() {
			status.update("Connected to FTDI...", 'ok');
			//module( "poling" ).unlock( 'smu.connection' ); // Unlock voc stab module
		})
		.on('disconnected', function() {
			status.update("Disconnected from FTDI", 'neutral');
			//module( 'poling' ).lock( 'smu.connection' ); // Unlock voc stab module
		})
		.on("connectionerror", function() {
			status.update("Error while connecting to the FTDI", 'error');
			//module( 'poling' ).unlock( 'smu.connection' ); // Unlock voc stab module
		});
	},


	streamOn: {

		'connect': function( ) {

			var module = this;
			module.streamOut( "pending", true );
			module.emit("connecting");
			module.lock();
			module.FTDI.connect();
		},

		'reset': function() {
			var module = this;
			module.FTDI.reset();
		},

		'disconnected': function() {

			var module = this;
			module.lock();
			module.emit("disconnecting");
			module.streamOut( "pending", true );
			module.FTDI.disconnect();
		}
	},


	getStatus: function() {
		return this.status;
	},

});

exports = module.exports = {
	Constructor: FTDIConnect
}
