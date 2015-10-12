
var pythonShell = require("python-shell");
var path = require("path");

var instrumentcontroller = require("./instrumentcontroller");
var util = require("util");

var SocketInstrumentController = function() {};

util.inherits( SocketInstrumentController, instrumentcontroller );


SocketInstrumentController.prototype.query = function( command ) {

	var instrument = this;

	return new Promise( function( resolver, rejecter ) {

		function end( data ) {
			data = data.replace("\n", "");
			if( method.processing ) {
				data = method.processing( data, options );
			}
			resolver( data );
		}

		function listen( prevData ) {

			instrument.socket.once( 'data', function( data ) {
				data = prevData + data.toString('ascii');
		
				if( data.indexOf("keithley:end;") == -1 ) {
				
					listen( data );
				} else {
					
					data = data.replace("keithley:end;", "" );
		//			console.log( data );
					end( data );

				}
			} );
		}

		listen("");
	
		instrument.socket.write( command + "\r\n" );
	} );
}


SocketInstrumentController.prototype.connect = function( ) {

	var module = this;

	return new Promise( function( resolver, rejecter ) {

		// Avoid multiple connection
		if( module.connected ) {

			module.socket.removeAllListeners( 'data' );
			resolver();
			return;
		}

		if( module.connecting ) {

 			module.connecting.then( function() {
 				resolver();
 			});
		}


		try {
			// Connect by raw TCP sockets

			var self = module,
				socket = net.createConnection( {
					port: module.config.port,
					host: module.config.host,
					allowHalfOpen: true
				});

			module.emit("connecting");

			self.log("Attempting to connect to " + module.getName() + " through raw sockets on host " + module.config.host + " (port " + module.config.port + ")");

			module.connecting = true;
			module.connected = false;

			module.socket = socket;

			var timeout = setTimeout( function() {

				module.connected = false;
				module.connecting = false;

				module.emit("connectionerror");

				rejecter();

				self.logError("Timeout while trying to connect to " + module.getName() + ".")
				module.socket.destroy(); // Kills the socket

			}, module.config.timeout || 10000 );


			module.socket.on('connect', function() {

				self.connected = true;
				self.connecting = false;

				clearTimeout( timeout );

				module.commands("ABORT", "digio.writeport(0)", "format.byteorder=format.LITTLEENDIAN" ).then( function() {

					self.socket.removeAllListeners( 'data' );
					
					setTimeout( function() {

						self.command("SpetroscopyScripts();"); // Load the scripts
						module.logOk("Connected to Keithley on host " + module.config.host + " on port " + module.config.port );

						self.emit("connected");
						resolver();

					}, 500);

				});					
			});

			module.socket.on('end', function() {
				module.socket.removeAllListeners( 'data' );
				self.emit("disconnected");
			});

		} catch( error ) {

			module.emit("connectionerror");
			rejecter( error );
		}

	} );

}




module.exports = SocketInstrumentController;