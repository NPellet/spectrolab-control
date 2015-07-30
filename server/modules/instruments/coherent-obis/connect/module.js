
var moduleProto = require('../../../../module'),
	extend = require('extend');

var OBISConnect = function() {
	this.title = "OBIS";
	this.status = {};
};


OBISConnect.prototype = new moduleProto();
OBISConnect.prototype = extend( OBISConnect.prototype, {


	assignInstrument: function( OBIS ) {

		var module = this;

		this.OBIS = OBIS;

		this.OBIS.on("connected", function() {

			module.streamOut( "connected" );
			module.status = "connected";
			module.emit("connected");

			module.unlock();
		} );

		this.OBIS.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.status = "disconnected";
			module.emit("disconnected");
		});

		this.OBIS.on( "connectionerror", function() {

			module.unlock();
			module.status = "error";
			module.emit("error");
		})


		return this;
	},

	streamOn: {

		'connect': function( ) {

			var module = this;
			module.streamOut( "pending", true );
			module.emit("connecting");
			module.lock();
			module.OBIS.connect();
		},

		'disconnected': function() {

			var module = this;
			module.lock();
			module.emit("disconnecting");
			module.streamOut( "pending", true );
			module.OBIS.disconnect();
		}
	},

	getStatus: function() {
		return this.status;
	}

});

exports = module.exports = {
	Constructor: OBISConnect
}
