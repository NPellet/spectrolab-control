
"use strict";

var
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform");

var pythonShell = require("python-shell"); // Used to communicate through VXI11 with the Tektronix AFG

var TektronixAFG = function( params ) {
	this.params = params;
	this.connected = false;
	this.queue = [];


	var self = this;
	function *runCommands( queue ) {

		while( true ) {

				while( queue.length == 0 ) {

					self.emit("queueEmpty");
					yield;
				}

				var running = true;

				var element = queue.shift();
				console.log( element );
				query( self.shellInstance, element.command ).then( function( data ) {
					console.log( data );
					element.promiseResolve( data );

				}/*, function( error ) {
					console.log('sdf');
					element.promiseReject();

				} */).finally( function() {

					running = false;
					self.commandRunner.next();

				});

				yield;

				// Does nothing if next is called and the process is running already
				while( running ) {
					yield;
				}
		}
	}


	this.commandRunner = runCommands( this.queue );
	this.runCommands();
};


TektronixAFG.prototype = new events.EventEmitter;

TektronixAFG.prototype.connect = function(  ) {

		var module = this;

		return new Promise( function( resolver, rejecter ) {

			// Avoid multiple connection
			if( module.connected ) {
				callback();
				return;
			}

			console.log( "Trying to connect to host " + module.params.host + " via VXI11" );

			// Launches a python instance which will communicate in VXI11 with the scope
			module.shellInstance = new pythonShell( 'io.py', {
				scriptPath: path.resolve( 'server/util/vxi11/' ),
				args: [ module.params.host ], // Pass the IP address
				mode: "text" // Text mode
			} );

		/*	module.shellInstance.on("message", function( data ) {
				console.log( data );
			})
*/

			// At this point we are already connected. No asynchronous behaviour with python
			module.connected = true;

			setTimeout( function() {

				module.command( "*IDN?" ).then(function( response ) {

					console.log( response );
				})

				resolver( module );

		} , 1000 );


		} );

	}

	TektronixAFG.prototype.runCommands = function() {
		this.commandRunner.next();
	}

	TektronixAFG.prototype.command = function( command ) {

		var self = this;

		return new Promise( function( resolver, rejecter ) {

			self.queue.push( {

				command: command,
				promiseResolve: resolver,
				promiseReject: rejecter
			} );

			self.runCommands();
		});
	}

	TektronixAFG.prototype.commands = function( commands ) {
		var self = this;
		commands.map( function( cmd ) {
			self.command(cmd);
		} );
	}


function query( shellInstance, query ) {

			var queries = shellInstance.queries;
			var ask = query.indexOf('?') > -1;

			return new Promise( function( resolver, rejecter ) {
				console.log( "Query:" + query );
				if( ask ) {

					function listen( prevData ) {

						shellInstance.once( 'message', function( data ) {

							data = prevData + data.toString('ascii');

						/*	if( data.indexOf("\n") == -1 ) {
								console.log('NThr');
								listen( data );
							} else {*/
console.log('Received: ' + data );
								//if( data.indexOf( query	 ) == 0 ) { // The response is exactly what has been requested
									resolver( data );
								//} else {
								//	console.log( 'Rejection');
								//	rejecter("The oscilloscope response was unexpected. Message : " + data);
								//}
							//}

						} );
					}

					listen("");

					shellInstance.send( query );

				} else {

					shellInstance.send( query );
					resolver();
				}

			} ).then( function( data ) {
				if( data ) {
					return data.replace("\n", "");
				}
			} );
}


TektronixAFG.prototype.setVoltageLowLimit = function( channel, voltage ) {

	channel = getChannel( voltage );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LIMIT:LOW " + voltage );
}


TektronixAFG.prototype.setVoltageHighLimit = function( channel, voltage ) {

	channel = getChannel( voltage );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LIMIT:HIGH " + voltage );
}

TektronixAFG.prototype.setVoltageAmplitude = function( channel, voltage ) {

	channel = getChannel( voltage );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LEVEL:IMMEDIATE:AMPLITUDE " + voltage );
}


TektronixAFG.prototype.setVoltageLow = function( channel, voltage ) {

	channel = getChannel( voltage );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LEVEL:IMMEDIATE:LOW " + voltage );
}


TektronixAFG.prototype.setVoltageHigh = function( channel, voltage ) {

	channel = getChannel( voltage );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LEVEL:IMMEDIATE:HIGH " + voltage );
}



TektronixAFG.prototype.setShape = function( channel, shape ) { // Delays the beginning of the pulse

	channel = getChannel( voltage );
	shape = getShape( shape );

	this.command("SOURCE" + channel + ":FUNCTION:SHAPE " + shape );
}


TektronixAFG.prototype.setPulsePeriod = function( channel, period ) {

	channel = getChannel( channel );
	period = getTime( period );

	this.command("SOURCE" + channel + ":PULSE:PERIOD " + period );
}

TektronixAFG.prototype.setPulseDutyCycle = function( channel, cycle ) { // Delays the beginning of the pulse

	channel = getChannel( voltage );
	cycle = getPercent( cycle );

	this.command("SOURCE" + channel + ":PULSE:DCYCLE " + time );
}


TektronixAFG.prototype.setPulseDelay = function( channel, time ) { // Delays the beginning of the pulse

	channel = getChannel( voltage );
	time = getTime( time );

	this.command("SOURCE" + channel + ":PULSE:DELAY " + time );
}


TektronixAFG.prototype.setPulseHold = function( channel, hold ) { // Asks to hold pulse width of pulse duty cycle

	channel = getChannel( voltage );
	hold = getFromList( hold, [ "WIDTH", "DUTY" ] );

	this.command("SOURCE" + channel + ":PULSE:HOLD " + time );
}


TektronixAFG.prototype.setPulseWidth = function( channel, time ) { // Only available in FUNCTION=PULSE

	channel = getChannel( voltage );
	time = getTime( time );

	this.command("SOURCE" + channel + ":PULSE:WIDTH " + time );
}


TektronixAFG.prototype.setPulseLeadingTime = function( channel, time ) { // Only available in FUNCTION=PULSE

	channel = getChannel( voltage );
	time = getTime( time );

	this.command("SOURCE" + channel + ":PULSE:TRANSITION:LEADING " + time );
}


TektronixAFG.prototype.setPulseTrailingTime = function( channel, time ) { // Only available in FUNCTION=PULSE

	channel = getChannel( voltage );
	time = getTime( time );

	this.command("SOURCE" + channel + ":PULSE:TRANSITION:TRAILING " + time );
}

TektronixAFG.prototype.setTriggerOut = function( channel, triggerType ) {

	channel = getChannel( channel );
	triggerType = getFromList( triggerType, [ "TRIGGER", "SYNC" ] );

	this.command("SOURCE" + channel + ":BURST:MODE " + triggerType );
}

TektronixAFG.prototype.enableBurst = function( channel ) {

	channel = getChannel( channel );
	this.command("SOURCE" + channel + ":BURST:STATE:ON");
}

TektronixAFG.prototype.disableBurst = function( channel ) {

	channel = getChannel( channel );
	this.command("SOURCE" + channel + ":BURST:STATE OFF");
}

TektronixAFG.prototype.setBurstTriggerDelay = function( channel, delay ) {

	channel = getChannel( channel );
	delay = getTime( delay );

	this.command("SOURCE" + channel + ":BURST:TDELAY " + delay );
}

TektronixAFG.prototype.setBurstNCycles = function( channel, ncycle ) {

	channel = getChannel( channel );
	ncycle = getNumber( ncycles );

	this.command("SOURCE" + channel + ":BURST:NCYCLES " + ncycles );
}

TektronixAFG.prototype.turnChannelOn = function( channel ) {

	channel = getChannel( channel );
	this.command("SOURCE" + channel + ":STATE ON");
}

TektronixAFG.prototype.turnChannelOff = function( channel ) {

	channel = getChannel( channel );
	this.command("SOURCE" + channel + ":STATE OFF");
}

function getChannel( channel ) {
	channel = parseInt( channel );
	if( channel == 1 || channel == 2 ) {
		return channel;
	}

	throw "Channel invalid";
}


function getTime( time ) {

	if( time.toLowerCase ) {
		if( /[0-9.]*(ns|us|ms|s)/.test( time.toLowerCase( ) ) ) {
			return time;
		}
	} else if( typeof time == "number") {
		return time;
	}

	throw "Time invalid";
}

function getVoltage( voltage ) {

	voltage = parseFloat( voltage );
	if( voltage > 10 || voltage < 10 ) {
		throw "Voltage invalid";
	}

	return voltage + "V";
}


function getNumber( nb ) {

	return parseFloat( nb );
}


function getPercent( val ) {
	var val = parseInt( val );
	if( val < 0 || val > 100 ) {
		throw "Invalid percentage";
	}
}

function getFromList( value, list ) {


	list.map( function( listElement ) {

		if( Array.isArray( listElement ) ) {
			listElement.map( function( listSubElement ) {
				if( listSubElement.toLowerCase() == value.toLowerCase() ) {
					return value;
				}
			})
		}

		if( listElement.toLowerCase() == value.toLowerCase() ) {
			return value;
		}
	});

	throw "Could not find element in list";
}

function getShape( shape ) {
	return getFromList( shape, [ ["SIN", "SINUSOID" ], [ "SQU", "SQUARE" ], [ "PULS", "PULSE" ], "RAMP", [ "PRN", "PRNOISE" ], "DC", "SINC", [ "GAUS", "GAUSSIAN" ], [ "LOR", "LORENTZ" ], ["ERIS", "ERISE"], ["EDEC", "EDECAY"], ["HAVERSINE"] ]);
}

module.exports = TektronixAFG;
