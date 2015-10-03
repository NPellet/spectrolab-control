


var InstrumentController = require("./instrumentcontroller"),
	Promise = require('bluebird'),
	SerialPort = require('serialport').SerialPort,
	extend = require('extend');


// Empty constructor
var SerialDevice = function() {};

SerialDevice.prototype = new InstrumentController();


function serialConnect( serialDevice, host, baudrate, options, timeoutTime ) {

	serialDevice._serialQueue = serialDevice._serialQueue || {};

	return ( serialDevice._serialOpening || ( serialDevice._serialOpening = new Promise( function( resolver, rejecter ) {

		var serialPort;

		serialDevice.emit("connecting");

		serialDevice.log("Attempting to connect to \"" + serialDevice.getName() + "\"");

		/* Handles connection timeout */
		var timeout = setTimeout( function() {

			serialDevice.emit("connectionerror");
			rejecter();

			serialDevice.logError("Failed to connect to \"" + serialDevice.getName() + "\"");

			if( serialPort ) {
				serialPort.close(); // Kills the socket
			}

		}, timeoutTime || 10000 );

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
				
				if( serialDevice.onConnectionInit ) {
					serialDevice.onConnectionInit();
				}

				serialDevice.emit( "connected" );
				serialDevice.logOk("Succesffully connected to \"" + serialDevice.getName() + "\"");

				serialDevice._serialConnected = true;
				serialDevice._serialOpening = false;
				resolver( serialPort );
			});

			serialDevice._serialPort = serialPort;

			serialPort.on('close', function() {

				if( timeout ) {
					clearTimeout( timeout );
				}
				serialDevice._serialConnected = false;
				serialDevice._serialOpening = false;

				serialDevice.logWarning("Disconnected from \"" + serialDevice.getName() + "\"");
				
				serialDevice.emit( "disconnected" );
			});

			serialPort.on('error', function() {
				

				if( timeout ) {
					clearTimeout( timeout );
				}

				serialDevice._serialConnected = false;
				serialDevice._serialOpening = false;

				
				serialDevice.emit( "connectionerror" );
				serialDevice.logError("Failed to connect to \"" + serialDevice.getName() + "\"");

			});


			var response = "";
			function endData( data ) {
				

				if( serialDevice.serialResolver ) {

					serialPort.drain( function() {

						serialPort.flush( function() {

							serialDevice.serialResolver();
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

	} ) ) );


}



function serialCall( serialDevice, method, priority ) {

	serialDevice.currentResponse = "";

	serialDevice.command( method, priority );


}


SerialDevice.prototype.connect = function( ) {

	var self = this;

	if( this.serialCheckConnection() ) {
		return new Promise( function( resolver ) { resolver( self._serialPort ); } );
	} else {
		return serialConnect( this, this.serialGetHost(), this.serialGetBaudrate(), this.serialGetOptions() );
	}

}


SerialDevice.prototype.serialClose = function() {

	var self = this;

	return new Promise( function( resolver, rejecter ) {

		serialDevice._serialPort.close( function( ) {

			serialDevice._serialConnected = false;
			resolver();
		});
	});
}

SerialDevice.prototype.serialCheckConnection = function() {

	return this._serialConnected;
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


SerialDevice.prototype.query = function( command, queueElement ) {

	var instrument = this;

	return new Promise( function( resolver, rejecter ) {

		instrument.serialResolver = resolver;
		instrument.serialRejecter = rejecter;

		var timeout;

		setTimeout( function() {
console.log( command );
			instrument._serialPort.write( command + "\n\r", function( err, results ) {

				if( err ) {
					throw err;
				}

				if( timeout ) {
					clearTimeout( timeout );
				}

			} );


		}, 20 );
		
		// The request has just been sent...
		timeout = setTimeout( function() {
			
			console.log('Serial port timeout. Closing connection');

			instrument.closeSerial( ).then( function() {

				console.log('Connection closed. Re-opening connection');

				instrument.serialConnect( ).then( function() {

					console.log('Connection reopened');
					instrument._queue.unshift( queueElement );
					rejecter();
					
				} );

			} );

		}, 10000 );

	} );
}

module.exports = SerialDevice;
