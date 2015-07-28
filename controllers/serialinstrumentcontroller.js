


var InstrumentController = require("./instrumentcontroller"),
	Promise = require('bluebird'),
	SerialPort = require('serialport');


// Empty constructor
var SerialDevice = function() {};

SerialDevice.prototype = new InstrumentController();


function serialConnect( serialDevice, host, baudrate, options ) {

	return new Promise( function( resolver, rejecter ) {

		var serialPort;

		serialDevice.log("Attempting to connect to \"" + serialDevice.getName() + "\"");

		/* Handles connection timeout */
		var timeout = setTimeout( function() {

			serialDevice.emit("connectionerror");
			rejecter();

			if( serialPort ) {
				serialPort.close(); // Kills the socket
			}

		}, timeout || 1000 );

		options = options || {
			stopBits: 1,
			parity: 'none',
			databits: 8,
			flowControl: true
		};

		try {

			serialPort = new SerialPort( host, extend( options, { baudrate: baudrate } ) );
			
			// The serial device has been opened
			serialPort.on("open", function() {
				clearTimeout( timeout );
				self.emit( "connected" );

				serialDevice._serialConnected = true;

				resolver( serialPort );
			});

			serialDevice._serialPort = serialPort;

			serialPort.on('close', function() {

				serialDevice._serialConnected = false;

				self.emit( "disconnected" );
			});

			serialPort.on('error', function() {

				serialDevice._serialConnected = false;
				
				self.emit( "error" );
			});


			var response = "";
			function endData( data ) {

				if( serialDevice._serialCurrentQueue ) {

					serialDevice._serialCurrentQueue.resolver( data );

					serialPort.drain( function() {

						serialPort.flush( function() {

							serialProcessQueue( serialDevice );
						});
					});
				}
			}

			serialPort.on( 'data', function( data ) {
				response = response + data.toString('ascii');
				if( ! ( response.indexOf("\r\n") == -1 ) ) {
					endData( response );
					response = "";
				}
			} );


		} catch ( error ) {

			serialDevice.logError("Could not connect to \"" + serialDevice.getName() + "\". Connection refused.");
			serialDevice.emit("connectionerror");
			rejecter();
		}
	} );
}



function serialCall( serialDevice, method ) {

	serialDevice.currentResponse = "";

	return new Promise( function( resolver, rejecter ) {

		serialDevice._serialQueue.push( { 
			method: method, 
			resolver: resolver, 
			rejecter: rejecter 
		} );

		 serialCheckQueue( serialDevice );

	} );
}

function serialCheckQueue( Arduino ) {

	if( serialCheckQueue._serialProcessingQueue ) { // Calls are already in progress
		return;
	}

	if( serielDevice._serialQueue && serielDevice._serialQueue.length > 0 ) {

		serielDevice.serialReady = new Promise( function( resolver ) {
			serielDevice._serialReadyResolver = resolver;
		});

		serialProcessQueue( serialDevice );
	}
}

function serialProcessQueue( Arduino ) {

	if( serialDevice._serialQueue && serialDevice._serialQueue.length == 0 ) {

		serialDevice._serialProcessingQueue = false;
		serialDevice._serialReadyResolver();
		return;
	}

	serialDevice._serialProcessingQueue = true;

	var queueElement = serialDevice._serialQueue.shift();

	return SerialDevice.connect().then( function( serialPort ) {

		var timeout;

		serialPort.write( queueElement.method + "\n", function( err, results ) {

			if( err ) {
				throw err;
			}

			if( timeout ) {
				clearTimeout( timeout );
			}

		} );

		// The request has just been sent...
		timeout = setTimeout( function() {
			
			console.log('Serial port timeout. Closing connection');

			serialDevice.closeSerial( ).then( function() {

				console.log('Connection closed. Re-opening connection');

				serialDevice.serialConnect( ).then( function() {

					console.log('Connection reopened');

					serialDevice._serialQueue.unshift( queueElement );
					serialProcessQueue( serialDevice );

				} );

			} );

		}, 10000 );


		serialDevice._serialCurrentQueue = queueElement;

	});
}

SerialDevice.prototype.serialConnect = function( ) {

	if( this.serialCheckConnection ) {

		return new Promise( function( resolver ) { resolver( ); } );

	} else {

		return serialConnect( this, this.serialGetHost(), this.serialGetBaudrate(), this.serialGetOptions() );

	}

}


SerialDevice.prototype.serialClose = function() {

	var self = this;

	return new Promise( function( resolver, rejecter ) {

		self.serialPort.close( function( ) {

			self._serialConnected = false;
			resolver();
		});
	});
}

SerialDevice.prototype.serialCheckConnection = function() {
	return this._serialConnected;
}

SerialDevice.prototype.serialCommand = function( command ) {

	return serialCall( this, command );
}

SerialDevice.prototype.serialGetHost = function( ) {
	return this._serialHost;
}

SerialDevice.prototype.serialSetHost = function( host ) {
	this._serialHost = host;
}

SerialDevice.prototype.serialGetBaudrate = function( ) {
	return this._serialBaudrate;
}

SerialDevice.prototype.serialSetBaudrate = function( baudrate ) {
	this._serialBaudrate = baudrate;
}

SerialDevice.prototype.serialGetOptions = function() {
	return this._serialOptions;
}

SerialDevice.prototype.serialSetOptions = function( options ) {
	this._serialOptions = options;
}

module.exports = SerialDevice;
