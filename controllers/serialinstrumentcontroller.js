


var InstrumentController = require("./instrumentcontroller"),
	Promise = require('bluebird'),
	SerialPort = require('serialport').SerialPort,
	extend = require('extend');


// Empty constructor
var SerialDevice = function() {};

SerialDevice.prototype = new InstrumentController();


function serialConnect( serialDevice, host, baudrate, options, timeoutTime ) {

	serialDevice._serialQueue = [];

	return ( serialDevice._serialOpening || ( serialDevice._serialOpening = new Promise( function( resolver, rejecter ) {

		var serialPort;

		serialDevice.log("Attempting to connect to \"" + serialDevice.getName() + "\"");

		/* Handles connection timeout */
		var timeout = setTimeout( function() {

			serialDevice.emit("connectionerror");
			rejecter();

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
				serialDevice.emit( "connected" );
				serialDevice.logOk("Succesffully connected to \"" + serialDevice.getName() + "\"");

				serialDevice._serialConnected = true;
				serialDevice._serialOpening = false;
				resolver( serialPort );
			});

			serialDevice._serialPort = serialPort;

			serialPort.on('close', function() {

				serialDevice._serialConnected = false;

				serialDevice.emit( "disconnected" );
			});

			serialPort.on('error', function() {

				serialDevice._serialConnected = false;
				
				serialDevice.emit( "error" );
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
	console.log( "new response" );
				if( ! ( response.indexOf("\r\n") == -1 ) ) {
					console.log("end");
					endData( response );
					response = "";
				}
			} );


		} catch ( error ) {

			console.log( error );
			serialDevice.logError("Could not connect to \"" + serialDevice.getName() + "\". Connection refused.");
			serialDevice.emit("connectionerror");
			rejecter();

		}

	} ) ) );


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

function serialCheckQueue( serialDevice ) {

	if( serialCheckQueue._serialProcessingQueue ) { // Calls are already in progress
		return;
	}

	if( serialDevice._serialQueue && serialDevice._serialQueue.length > 0 ) {

		serialDevice.serialReady = new Promise( function( resolver ) {
			serialDevice._serialReadyResolver = resolver;
		});

		serialProcessQueue( serialDevice );
	}
}

function serialProcessQueue( serialDevice ) {

	if( serialDevice._serialQueue && serialDevice._serialQueue.length == 0 ) {

		serialDevice._serialProcessingQueue = false;
		serialDevice._serialReadyResolver();
		return;
	}

	serialDevice._serialProcessingQueue = true;

	var queueElement = serialDevice._serialQueue.shift();

	return serialDevice.serialConnect().then( function( serialPort ) {

		var timeout;

		setTimeout( function() {

			serialPort.write( queueElement.method + "\n\r", function( err, results ) {

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

		serialDevice.serialPort.close( function( ) {

			serialDevice._serialConnected = false;
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
