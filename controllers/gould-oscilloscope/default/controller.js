
"use strict";


var SerialPort = require('serialport').SerialPort,
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform");


var timeout;

var Gould = function( params ) {
	this.params = params;
	this.connected = false;
	this.queue = [];
};

Gould.prototype = new events.EventEmitter;

Gould.prototype.connect = function( ) {

	var module = this;

	return new Promise( function( resolver, rejecter ) {

		if( module.connected ) {

			resolver( module.serialPort );
			module.connected = true;
			//module.emit("connected");
			module.emit("idle");
			return;
		}

		module.emit("busy");

		try {

			var serialPort = new SerialPort( module.params.host, {
  				baudrate: module.params.baudrate,
  				stopBits: 1,
  				parity: 'none',
  				databits: 8,
  				flowControl: true,
  				rtscts: true
			});

			module.serialPort = serialPort;

		} catch ( error ) {
			console.log( error );
			throw "Error while connecting to the gould";

			module.emit("connectionerror");
			rejecter();
		}

		setEvents( module, resolver );

	} );
};

Gould.prototype.close = function() {

	var self = this;

	return new Promise( function( resolver, rejecter ) {

		self.serialPort.close( function( ) {
			self.connected = false;
			resolver();
		});
	});
}

Gould.prototype.checkConnection = function() {

	if( ! this.serialPort && this.connected ) {

		throw "Socket is not alive";
	}
}

Gould.prototype.ID = function( ) {
	return callSerial( this, "*IDN?");
}


Gould.prototype.enable50Ohms = function( channel ) {
	var channel = getChannel( channel );
	return callSerial( this, ":" + channel + ":TERM50 ON");
}

Gould.prototype.disable50Ohms = function( channel ) {
	var channel = getChannel( channel );
	return callSerial( this, ":" + channel + ":TERM50 OFF");
}

Gould.prototype.enable50Ohm = Gould.prototype.enable50Ohms;
Gould.prototype.disable50Ohm = Gould.prototype.disable50Ohms;


Gould.prototype.getAvailableVoltScaleNb = function() {
	return [ 2e-3, 5e-3, 10e-3, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 10e-3, 2e-2, 5e-2, 10e-2, 2e-1, 5e-1, 10e-1, 2, 5 ];
}

Gould.prototype.getAvailableVoltScaleTxt = function() {
	return [ "2 mV", "5 mV", "10 mV", "20 mV", "50 mV", "100 mV", "200 mV", "500 mV", "1 V", "2 V", "5 V" ];
}

Gould.prototype.setVoltScale = function( channel, voltscale ) {

	var availableVoltScale = this.getAvailableTimebasesNb();
	if( availableVoltScale.indexOf( voltscale ) == -1 ) {
		throw "Cannot set volt scale \"" + voltscale + "\". Not in allowed list";
		return;
	}

	channel = getChannel( channel );
	return callSerial( this, ":" + channel + ":RANG " + voltscale );
}

Gould.prototype.getVoltScale = function( channel ) {
	channel = getChannel( channel );
	return callSerial( this, ":" + channel + ":RANG?").then( function( val ) {
		return parseFloat( val.split(" ").pop() );
	});
}


Gould.prototype.setTriggerToChannel = function( trigger, channel ) {
	channel = getChannel( channel );
	trigger = getTrigger( trigger );
	return callSerial( this, ":" + trigger + ":SO " + channel );
}

Gould.prototype.setTriggerSlope = function( trigger, slope ) {

	trigger = getTrigger( trigger );

	switch( slope ) {

		case 'MIN':
		case 0:
		case 'DESC':
		case 'DOWN':
			slope = "MIN";
		break;

		default:
		case 1:
		case 'ASC':
		case 'UP':
		case 'PL':
			slope = "PL";
		break;
	}

	return callSerial( this, ":" + trigger + ":SLOPE " + slope );
}

Gould.prototype.setPreTrigger = function( trigger, percent ) {

	trigger = getTrigger( trigger );

	if( percent < 1 ) {
		percent += 10;
	}

	if( percent > 100 ) {
		percent = 100;
	}

	return callSerial( this, ":" + trigger + ":PRE " + percent );
}

Gould.prototype.setTriggerLevel = function( trigger, level ) {

	trigger = getTrigger( trigger );

	return callSerial( this, ":" + trigger + ":LEVEL " + level );
}


Gould.prototype.setTriggerCoupling = function( trigger, coupling ) {

	trigger = getTrigger( trigger );
	coupling = getCoupling( coupling );

	return callSerial( this, ":" + trigger + ":COUP " + coupling );
}

Gould.prototype.getAvailableTimebasesNb = function() {
	return [ 10e-6, 20e-6, 50e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 10e-2, 20e-2, 50e-2, 1e-1, 2e-1, 5e-1, 1, 2, 5 ];
}


Gould.prototype.getAvailableTimebasesTxt = function() {
	return [ "10 µs", "20 µs", "50 µs", "100 µs", "200 µs", "500 µs", "1 ms", "2 ms", "5 ms", "10 ms", "20 ms", "50 ms", "100 ms", "1 s", "2 s", "5 s" ];
}


Gould.prototype.setTimeBase = function( timeBase ) {

	var availableTimeBases = this.getAvailableTimebasesNb();
	
	if( availableTimeBases.indexOf( timeBase ) == -1 ) {
		throw "Cannot set timebase \"" + timeBase + "\". Not in allowed list";
		return;
	}

	return callSerial( this, ":ACQ:TBASE " + timeBase );
}

Gould.prototype.setChannelPosition = function( channel, position ) {

	channel = getChannel( channel );
	return callSerial( this, ":" + channel + ":POS " + position );
}

Gould.prototype.getTimeBase = function() {
	return callSerial( this, ":ACQ:TBASE?").then( function( val ) {

		return parseFloat( val.split(" ").pop() );
	});
}


Gould.prototype.setAveraging = function( nb ) {
	nb = parseInt( nb );
	return callSerial( this, ":ACQ:AVG:EN ON;:ACQ:AVG:FACT " + nb );
}

Gould.prototype.setAverage = Gould.prototype.setAveraging; // Alias

Gould.prototype.disableAveraging = function( ) {
	return callSerial( this, ":ACQ:AVG:EN OFF" );
}


Gould.prototype.enableAveraging = function( ) {
	return callSerial( this, ":ACQ:AVG:EN ON" );
}

Gould.prototype.setCoupling = function( channel, coupling ) {

	channel = getChannel( channel );

	switch( coupling ) {

		case 'ac':
		case 'AC':
			coupling = "AC";
		break;

		case 'dc':
		case 'DC':
			coupling = "DC";
		break;

		case 'GND':
		case 'gnd':
		case 'ground':
		case 'GROUND':
			coupling = "GND";
		break;
	}

	return callSerial( this, ":" + channel + ":COUP " + coupling );
}


Gould.prototype.setCouplings = function( couplings ) {

	var command = "";
	var channel, coupling;

	couplings.map( function( c ) {

		channel = getChannel( c[ 0 ] );
		coupling = getCoupling( c[ 1 ] );
		command += ":" + channel + ":COUP " + coupling + ";"

	} );

	return callSerial( this, command );
}


Gould.prototype.getWave = function( channel ) {

	var w = new Waveform();
	var self = this;

	return this.sequence( [ "getData", channel ], "getTimeBase", [ "getVoltScale", channel ] ).then( function( output ) {

		w.setData( output[ 0 ] );
		w.divide( 256 );
		w.multiply( output[ 2 ] * 10 );
		w.setXScaling( 0, output[ 1 ] * 10 / w.getDataLength() );

		return w;

	});
}


Gould.prototype.getData = function( channel ) {
	var channel = getChannel( channel, true );

	return callSerial( this, ":TRAN:MAIN:DATA?TR" + channel ).then( function( data ) {
		// Possible processing

		data = data.split(',');
		data.shift()
		data = data.map( parseFloat );
		return data;
	} );
}



Gould.prototype.getWaves = function( ) {

	var w = new Waveform();
	var self = this;

	return this.sequence( [ "getWave", 1 ], [ "getWave", 2 ], [ "getWave", 3 ], [ "getWave", 4 ] ).then( function( output ) {

		return {
			"1": output[ 0 ],
			"2": output[ 1 ],
			"3": output[ 2 ],
			"4": output[ 3 ]
		};
	});
}

Gould.prototype.sequence = function() {

	var args = arguments,
		gould = this,
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
				promise = gould[ args[ i ][ 0 ] ].apply( gould, Array.prototype.slice.call( args[ i ], 1 ) );
			} else {
				promise = gould[ args[ i ] ]();
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



Gould.prototype.serialSequence = function() {

	var args = arguments,
		gould = this,
		i = -1,
		l = args.length,
		results = [];

	return new Promise( function( resolver, rejecter ) {

		function next() {

			if( i == l - 1 ) {
				resolver.apply( gould, results );
				return;
			}

			i += 1;

			promise = callSerial( gould, args[ i ] );
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

Gould.prototype.reset = function() {


	var self = this;

	return new Promise( function( resolver, rejecter ) {

		self.emit("busy");
		self.serialSequence(
			"*RST;*CLS;"//,


			//"*IDN?"
		);

		setTimeout( function() {

			self.serialSequence(
				":RS423:HA RTS;"
			);


			setTimeout( function() {

				self.serialSequence(
					":BL ONE;",
					":DISP:TR1M:STA 1;",
					":DISP:TR2M:STA 1;",
					":DISP:TR3M:STA 1;",
					":DISP:TR4M:STA 1;",
					":TRIGA:PRE 10",
					":TRIGA:LEVEL1 1",
					":TRIGA:AUT OFF",
					":TRIGA:SO CHAN1"
				);

				setTimeout( function() {

					self.emit( "idle" );
					resolver();

				}, 1000 );

			}, 2000);

		}, 5000);
	});

}


function callSerial( gould, method ) {

	gould.currentResponse = "";

	var queueElement = [];
	queueElement.push( method );

	queueElement.push( new Promise( function( resolver, rejecter ) {
		queueElement.push( resolver );
		queueElement.push( rejecter );
	}) );

	gould.queue.push( queueElement );


 	checkQueue( gould );

 	return queueElement[ 3 ];
}

function checkQueue( gould ) {

	if( gould.processingQueue ) {
		return;
	}

	if( gould.queue.length > 0 ) {

		gould.ready = new Promise( function( resolver ) {
			gould.readyResolve = resolver;
		});

		processQueue( gould );
	}
}

function processQueue( gould ) {

	if( gould.queue.length == 0 ) {
		gould.processingQueue = false;
		gould.readyResolve();
		return;
	}

	gould.processingQueue = true;

	var queueElement = gould.queue.shift();

	return gould.connect().then( function( serialPort ) {


		serialPort.write( queueElement[ 0 ] + "\n", function( err, results ) {
			if( err ) {
				console.warn( err );
			}
		} );

		timeout = setTimeout( function() {
			console.log('Serial port timeout. Closing connection');

			gould.close().then( function() {

				console.log('Connection closed. Re-opening connection');
				gould.connect().then( function() {
					console.log('Connection reopened');
					gould.queue.unshift( queueElement );
					processQueue( gould );
				});

			});

		}, 10000 );

		if( queueElement[ 0 ].indexOf('?') > -1 ) {

			gould.currentCallResolver = queueElement[ 1 ];
			gould.currentCallRejecter = queueElement[ 2 ];


		} else {


			serialPort.drain( function() {

				serialPort.flush( function() {

					if( timeout ) {
						clearTimeout( timeout );
						timeout = false;
					}
					queueElement[ 1 ]();
					processQueue( gould );

				});
			});


		}
	});
}

function getChannel( channel, number ) {

	if( typeof channel == "number" ) {
		channel = Math.round( channel );
		if( channel > 4 || channel < 1 ) {
			throw "Channel must be between 1 and 4";
		}

		//return "CHAN" + channel;
	} else if( channel.length == 1) {
		channel = parseInt( channel );
	}

	if( number ) {
		return channel;
	}

	return "CHAN" + channel;
}


function getTrigger( trigger ) {

	switch( trigger.toLowerCase() ) {

		case '2':
		case 2:
		case "b":
			return "TRIGB";
		break;

		case '1':
		case 1:
		case 'a':
			return "TRIGA";
		break;
	}
}

function getCoupling( coupling ) {

	switch( coupling ) {

		case 'ac':
		case 'AC':
			coupling = "AC";
		break;

		case 'dc':
		case 'DC':
			coupling = "DC";
		break;

		case 'GND':
		case 'gnd':
		case 'ground':
		case 'GROUND':
			coupling = "GND";
		break;
	}
	return coupling;
}

function setEvents( gould, resolver ) {

	gould.checkConnection();

	var self = gould;
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

	serialPort.on('error', function( error ) {
console.log( error );
		self.emit("error");
	});


	function endData( data ) {

		if( gould.currentCallResolver ) {

			gould.currentCallResolver( gould.currentResponse );
			serialPort.drain( function() {

				serialPort.flush( function() {


					if( timeout ) {
						clearTimeout( timeout );
						timeout = false;
					}

					processQueue( gould );
				});
			});


		}
	}

	serialPort.on( 'data', function( data ) {
		gould.currentResponse = gould.currentResponse + data.toString('ascii');
		if( ! ( gould.currentResponse.indexOf("\r") == -1 ) ) {
			endData( gould.currentResponse );
		}
	} );


}

module.exports = Gould;
