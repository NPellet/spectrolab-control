
var moduleProto = require('../../../../module'),
	extend = require('extend');

var oscilloscopeConnect = function() {
	this.title = "Oscilloscope";
	this.status = {};
};


oscilloscopeConnect.prototype = new moduleProto();
oscilloscopeConnect.prototype = extend( oscilloscopeConnect.prototype, {


	assignInstrument: function( oscilloscope ) {

		var module = this;

		this.oscilloscope = oscilloscope;

		this.oscilloscope.on("connected", function() {

			module.streamOut( "connected" );
			module.status = "connected";
			module.emit("connected");

			module.unlock();
		} );

		this.oscilloscope.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.status = "disconnected";
			module.emit("disconnected");
		});

		this.oscilloscope.on( "connectionerror", function() {

			module.unlock();
			module.status = "error";
			module.emit("error");
		})


		return this;
	},


	assignStatus: function( status ) {

		this.on("connecting", function() {
			status.update("Connecting to oscilloscope ...", 'process');
		})
		.on('connected', function() {
			status.update("Connected to oscilloscope ", 'ok');
			//module( "poling" ).unlock( '.connection' ); // Unlock voc stab module
		})
		.on('disconnected', function() {
			status.update("Disconnected from oscilloscope ", 'neutral');
			//module( 'poling' ).lock( '.connection' ); // Unlock voc stab module
		})
		.on("connectionerror", function() {
			status.update("Error while connecting to the oscilloscope", 'error');
			//module( 'poling' ).unlock( '.connection' ); // Unlock voc stab module
		});
	},


	streamOn: {

		'connect': function( ) {

			var module = this;
			module.streamOut( "pending", true );
			module.emit("connecting");
			module.lock();
			module.oscilloscope.connect().catch( function( error ) {

				console.error("Error while connecting to oscilloscope. Error : ");
				console.error( error );


				module.emit("connectionerror");
			});
		},

		'disconnected': function() {

			var module = this;
			module.lock();
			module.emit("disconnecting");
			module.streamOut( "pending", true );
			module.oscilloscope.disconnect().catch( function( error ) {

				console.error("Error while disconnecting from oscilloscope. Error : ");
				console.error( error );

				module.emit("connectionerror");
			});
		}
	},

	getStatus: function() {
		return this.status;
	}

});

exports = module.exports = {
	Constructor: oscilloscopeConnect
}
