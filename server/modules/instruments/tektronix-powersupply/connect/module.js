
var moduleProto = require('../../../../module'),
	extend = require('extend');

var PWSConnect = function() {
	this.title = "PWS";
	this.status = {};
};


PWSConnect.prototype = new moduleProto();
PWSConnect.prototype = extend( oscilloscopeConnect.prototype, {


	assignInstrument: function( oscilloscope ) {

		var module = this;

		this.pws = pws;

		this.pws.on("connected", function() {

			module.streamOut( "connected" );
			module.status = "connected";
			module.emit("connected");

			module.unlock();
		} );

		this.pws.on( "disconnected", function() {

			module.unlock();
			module.streamOut( "disconnected", true );
			module.status = "disconnected";
			module.emit("disconnected");
		});

		this.pws.on( "connectionerror", function() {

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
			module.pws.connect();
		},

		'disconnected': function() {

			var module = this;
			module.lock();
			module.emit("disconnecting");
			module.streamOut( "pending", true );
			module.pws.disconnect();
		}
	},

	getStatus: function() {
		return this.status;
	}

});

exports = module.exports = {
	Constructor: PWSConnect
}
