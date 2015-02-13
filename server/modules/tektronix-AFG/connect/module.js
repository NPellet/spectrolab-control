
var moduleProto = require('../../../module'),
	extend = require('extend');

var AFGConnect = function() {
	this.title = "AFG Connection";
	this.status = {};
};


AFGConnect.prototype = new moduleProto();
AFGConnect.prototype = extend( AFGConnect.prototype, {


	assignAFG: function( afg ) {

		var module = this;

		this.afg = afg;

		this.afg.on("connected", function() {

			module.streamOut( "connected" );
			module.status.connected = true;
			module.emit("connected");

			module.unlock();
		} );

		this.afg.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.status.connected = false;
			module.emit("disconnected");
		});

		this.afg.on( "connectionerror", function() {

			module.unlock();
			module.emit("connectionerror");
		})


		return this;
	},


	assignStatus: function( status ) {

		this.on("connecting", function() {
			status.update("Connecting to Tektronix AFG...", 'process');
		})
		.on('connected', function() {
			status.update("Connected to Tektronix AFG", 'ok');
			//module( "poling" ).unlock( 'smu.connection' ); // Unlock voc stab module
		})
		.on('disconnected', function() {
			status.update("Disconnected from Tektronix AFG", 'neutral');
			//module( 'poling' ).lock( 'smu.connection' ); // Unlock voc stab module
		})
		.on("connectionerror", function() {
			status.update("Error while connecting to the Tektronix AFG", 'error');
			//module( 'poling' ).unlock( 'smu.connection' ); // Unlock voc stab module
		});
	},


	streamOn: {

		'connect': function( ) {

			var module = this;
			module.streamOut( "pending", true );
			module.emit("connecting");
			module.lock();
			module.afg.connect();
		},

		'disconnected': function() {

			var module = this;
			module.lock();
			module.emit("disconnecting");
			module.streamOut( "pending", true );
			module.afg.disconnect();
		}
	},

	getStatus: function() {
		return this.status;
	}

});

exports = module.exports = {
	Constructor: AFGConnect
}
