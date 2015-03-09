
"use strict";


var SerialPort = require('serialport').SerialPort,
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform");


var timeout;

function doConnect( arduino, resolver ) {

	if( ! arduino.params || ! arduino.params.host ) {
		throw "No Arduino host was found";
	}

	try {

		var serialPort = new SerialPort( arduino.params.host, {
				baudrate: arduino.params.baudrate,
				stopBits: 1,
				parity: 'none',
				databits: 8,
				flowControl: true
		});

		arduino.serialPort = serialPort;

	} catch ( error ) {
		console.log( error );
		throw "Error while connecting to the Arduino";

		arduino.emit("connectionerror");
		rejecter();
	}

	setEvents( arduino, resolver );
}

var Arduino = function( params ) {
	this.params = params;
	this.connected = false;
	this.queue = [];
};



Arduino.prototype = new events.EventEmitter;

Arduino.prototype.connect = function( ) {

	/* Corresponding IGOR code

	Function SetupArduino()
		STRUCT ArduinoSeqSettings ards
		ARDSetSeqSettings(ards)
		SVAR S_bootver,S_mainver,S_response
		Variable n,num,flg=1,V_VDT; string port,S_value
		VDTGetPortList2
		port=StringFromList(0,ListMatch(S_VDT,"usbmodem*"))
		if (strlen(port)>0)
	//		print "Found Port#0:",port													// First Arduino port name(s)
		else
			print S_VDT
			abort " No Arduino USB board found"
		endif
		ards.gWhichComStr=port[0,strlen(port)-1]
		print "USB3 Arduino:",ards.gWhichComStr
		VDT2/P=$ards.gWhichComStr baud=115200,stopbits=1,databits=8,parity=0,in=0,out=0
		VDTOperationsPort2 $ards.gWhichComStr
		VDTWrite2/O=2 "2H"																// Added to warm up Arduino!
	End
	*/

	var module = this;

	return new Promise( function( resolver, rejecter ) {

		if( module.connected ) {
			resolver( module.serialPort );
			module.connected = true;
			module.emit("idle");
			return;
		}

		module.emit("busy");


		if( ! module.params.host ) {

			var serialPort = require("serialport");

			serialPort.list(function (err, ports) {

				ports.forEach(function(port) {

					if( port.comName && port.comName.indexOf("/dev/cu.usbmodem") > -1 ) {

						module.params.host = port.comName;
						doConnect( module, resolver );
					}
				});
			});

			return;
		}

		doConnect( module, resolver );
	} );
};


Arduino.prototype.setWhiteLightLevel = function( whiteLightLevel ) {
	var cmd = "5," + this.params.whiteLightLED.arduinoAnalogPin + "," + this.params.whiteLightLED.arduinoAnalogValue[ whiteLightLevel ] + ";";
	return callSerial( this, cmd );
}


Arduino.prototype.setWhiteLightLevelVoltage = function( whiteLightLevel ) {
	var max;
	if( whiteLightLevel > ( max = this.params.whiteLightLED.arduinoAnalogValue[ 0 ] ) ) {
			whiteLightLevel = max;
	}


	var cmd = "5," + this.params.whiteLightLED.arduinoAnalogPin + "," + whiteLightLevel + ";";
	return callSerial( this, cmd );
}



Arduino.prototype.setColorLightLevelVoltage = function( voltage ) {

	if( voltage > 2000 ) {
		voltage = 2000;
	}

	if( voltage < 0 ) {
		voltage = 0;
	}


	var cmd = "5," + this.params.colorLightLED.arduinoAnalogPin + "," + voltage + ";";
	return callSerial( this, cmd );
}


Arduino.prototype.close = function() {

	var self = this;

	return new Promise( function( resolver, rejecter ) {

		self.serialPort.close( function( ) {
			self.connected = false;
			resolver();
		});
	});
}

Arduino.prototype.checkConnection = function() {

	if( ! this.serialPort && this.connected ) {

		throw "Socket is not alive";
	}
}

Arduino.prototype.sendCommand = function( command ) {

	return callSerial( this, command );
}


Arduino.prototype.sequence = function() {

	var args = arguments,
		Arduino = this,
		i = -1,
		l = args.length,
		results = [];

	return new Promise( function( resolver, rejecter ) {

		function next() {

			if( i == l - 1) {
				resolver( results );
				return;
			}

			i += 1;

			if( Array.isArray( args[ i ] ) ) {
				promise = Arduino[ args[ i ][ 0 ] ].apply( Arduino, Array.prototype.slice.call( args[ i ], 1 ) );
			} else {
				promise = Arduino[ args[ i ] ]();
			}

			promise.then( function( val ) {
				results.push( val );
				next();
			}, function() {
				throw "Cannot sequence request " + args[ i ];
				rejecter();
			});
		}

		next();
	});
}



Arduino.prototype.serialSequence = function() {

	var args = arguments,
		Arduino = this,
		i = -1,
		l = args.length,
		results = [];

	return new Promise( function( resolver, rejecter ) {

		function next() {

			if( i == l - 1 ) {
				resolver.apply( Arduino, results );
				return;
			}

			i += 1;

			promise = callSerial( Arduino, args[ i ] );
			promise.then( function( val ) {

				results.push( val );
				next();

			}, function() {
				throw "Failure to execute : \"" + args[ i ] + "\"";
				rejecter();
			});
		}

		next();
	});
}


function callSerial( Arduino, method ) {

	Arduino.currentResponse = "";

	var queueElement = [];
	queueElement.push( method );

	queueElement.push( new Promise( function( resolver, rejecter ) {
		queueElement.push( resolver );
		queueElement.push( rejecter );
	}) );

	Arduino.queue.push( queueElement );


 	checkQueue( Arduino );

 	return queueElement[ 3 ];
}

function checkQueue( Arduino ) {

	if( Arduino.processingQueue ) {
		return;
	}

	if( Arduino.queue.length > 0 ) {

		Arduino.ready = new Promise( function( resolver ) {
			Arduino.readyResolve = resolver;
		});

		processQueue( Arduino );
	}
}

function processQueue( Arduino ) {

	if( Arduino.queue.length == 0 ) {
		Arduino.processingQueue = false;
		Arduino.readyResolve();
		return;
	}

	Arduino.processingQueue = true;

	var queueElement = Arduino.queue.shift();

	return Arduino.connect().then( function( serialPort ) {


		serialPort.write( queueElement[ 0 ] + "\n", function( err, results ) {

			if( err ) {
				console.warn( err );
			}
		} );

		timeout = setTimeout( function() {
			console.log('Serial port timeout. Closing connection');

			Arduino.close().then( function() {

				console.log('Connection closed. Re-opening connection');
				Arduino.connect().then( function() {
					console.log('Connection reopened');
					Arduino.queue.unshift( queueElement );
					processQueue( Arduino );
				});

			});

		}, 10000 );

		if( queueElement[ 0 ].indexOf('?') > -1 || 1 == 1 ) {

			Arduino.currentCallResolver = queueElement[ 1 ];
			Arduino.currentCallRejecter = queueElement[ 2 ];


		} else {


			serialPort.drain( function() {

				serialPort.flush( function() {

					if( timeout ) {
						clearTimeout( timeout );
						timeout = false;
					}
					queueElement[ 1 ]();
					processQueue( Arduino );

				});
			});


		}
	});
}


function setEvents( Arduino, resolver ) {

	Arduino.checkConnection();

	var self = Arduino;
	var serialPort = self.serialPort;

	serialPort.on("open", function() {

		self.connected = true;
		self.emit("connected");
		self.emit("idle");

		resolver( serialPort );

	});

	serialPort.on('close', function() {

		self.emit("disconnected");
	});

	serialPort.on('error', function() {

		self.emit("error");
	});


	function endData( data ) {

		if( Arduino.currentCallResolver ) {
			Arduino.currentCallResolver( Arduino.currentResponse );

			serialPort.drain( function() {

				serialPort.flush( function() {


					if( timeout ) {
						clearTimeout( timeout );
						timeout = false;
					}

					processQueue( Arduino );
				});
			});


		}
	}

	serialPort.on( 'data', function( data ) {

		Arduino.currentResponse = Arduino.currentResponse + data.toString('ascii');

		if( ! ( Arduino.currentResponse.indexOf("\r\n") == -1 ) ) {

			endData( Arduino.currentResponse );
		}
	} );


}

module.exports = Arduino;
