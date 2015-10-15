
"use strict";

var
	path = require("path"),
	promise = require("bluebird");

var InstrumentController = require("../../vxi11instrumentcontroller");
var pythonShell = require("python-shell"); // Used to communicate through VXI11 with the Tektronix AFG

var TektronixAFG = function( ) {
	
	this.connected = false;
	this.queue = [];

};


TektronixAFG.prototype = new InstrumentController();


TektronixAFG.prototype.getErrors = function() {
	var self = this;
	this.command("*ESR?"); // Read errors from the Status Event Register. Put then into the queue

	return new Promise( function( resolver ) {

		var errorQueue;
		var i = 0;
		function *errors() {

			while( true ) {

				self.command("SYSTEM:ERROR:NEXT?").then( function( error ) {

						error = error.split(',');
						var errorCode = parseInt( error[ 0 ] );
						var errorMessage = error[ 1 ].replace( /"/g, '' );

						i++;
						if( i > 100 ) {
							console.log( "Infinite loop" );
							return; // Infinite loop. Close the iterator;
						}
						if( errorCode != 0 ) {
							console.log("Error: " + errorCode + "; Message: " + errorMessage );
							errorQueue.next();
						} else {

							resolver();
						}

				} );

				yield;
			}
		}

		errorQueue = errors();
		errorQueue.next();

	})

}

TektronixAFG.prototype.setVoltageLowLimit = function( channel, voltage ) {

	channel = getChannel( channel );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LIMIT:LOW " + voltage );
}


TektronixAFG.prototype.setVoltageHighLimit = function( channel, voltage ) {

	channel = getChannel( channel );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LIMIT:HIGH " + voltage );
}

TektronixAFG.prototype.setVoltageAmplitude = function( channel, voltage ) {

	channel = getChannel( channel );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LEVEL:IMMEDIATE:AMPLITUDE " + voltage );
}


TektronixAFG.prototype.setVoltageLow = function( channel, voltage ) {

	channel = getChannel( channel );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LEVEL:IMMEDIATE:LOW " + voltage );
}


TektronixAFG.prototype.setVoltageHigh = function( channel, voltage ) {

	channel = getChannel( channel );
	voltage = getVoltage( voltage );

	this.command("SOURCE" + channel + ":VOLTAGE:LEVEL:IMMEDIATE:HIGH " + voltage );
}


TektronixAFG.prototype.setVoltageOffset = function( channel, offset ) {

	channel = getChannel( channel );
	offset = getVoltage( offset );

	this.command("SOURCE" + channel + ":VOLTAGE:LEVEL:IMMEDIATE:OFFSET " + offset );
}




TektronixAFG.prototype.setFrequency = function( channel, frequency ) { // Delays the beginning of the pulse

	channel = getChannel( channel );
	frequency = frequency + "Hz";

	this.command("SOURCE" + channel + ":FREQUENCY:MODE FIXED");

	this.command("SOURCE" + channel + ":FREQUENCY:FIXED " + frequency );
}

TektronixAFG.prototype.setShape = function( channel, shape ) { // Delays the beginning of the pulse

	channel = getChannel( channel );
	shape = getShape( shape );

	this.command( "SOURCE" + channel + ":FUNCTION:SHAPE " + shape );
}


TektronixAFG.prototype.setPulsePeriod = function( channel, period ) {

	channel = getChannel( channel );
	period = getTime( period );

	this.command( "SOURCE" + channel + ":PULSE:PERIOD " + period );
}

TektronixAFG.prototype.setPulseDutyCycle = function( channel, cycle ) { // Delays the beginning of the pulse

	channel = getChannel( channel );
	cycle = getPercent( cycle );

	this.command( "SOURCE" + channel + ":PULSE:DCYCLE " + time );
}


TektronixAFG.prototype.setPulseDelay = function( channel, time ) { // Delays the beginning of the pulse

	channel = getChannel( channel );
	time = getTime( time );

	this.command( "SOURCE" + channel + ":PULSE:DELAY " + time );
}


TektronixAFG.prototype.setPulseHold = function( channel, hold ) { // Asks to hold pulse width of pulse duty cycle

	channel = getChannel( channel );
	hold = getFromList( hold, [ "WIDTH", "DUTY" ] );

	this.command( "SOURCE" + channel + ":PULSE:HOLD " + hold );
}


TektronixAFG.prototype.setPulseWidth = function( channel, time ) { // Only available in FUNCTION=PULSE

	channel = getChannel( channel );
	time = getTime( time );

	this.command("SOURCE" + channel + ":PULSE:WIDTH " + time );
}


TektronixAFG.prototype.setPulseLeadingTime = function( channel, time ) { // Only available in FUNCTION=PULSE

	channel = getChannel( channel );
	time = getTime( time );

	this.command("SOURCE" + channel + ":PULSE:TRANSITION:LEADING " + time );
}


TektronixAFG.prototype.setPulseTrailingTime = function( channel, time ) { // Only available in FUNCTION=PULSE

	channel = getChannel( channel );
	time = getTime( time );

	this.command("SOURCE" + channel + ":PULSE:TRANSITION:TRAILING " + time );
}

TektronixAFG.prototype.setTriggerOut = function( triggerType ) {

	triggerType = getFromList( triggerType, [ "TRIGGER", "SYNC" ] );
	this.command("OUPUT:TRIGGER:MODE " + triggerType );
}


TektronixAFG.prototype.setBurstMode = function( channel, mode ) {

	channel = getChannel( channel );
	mode = getFromList( mode, [ [ "TRIGGERED", "TRIG" ] , [ "GAT", "GATED" ] ] );

	this.command("SOURCE" + channel + ":BURST:MODE " + mode );
}

TektronixAFG.prototype.enableBurst = function( channel ) {

	channel = getChannel( channel );
	this.command("SOURCE" + channel + ":BURST:STATE ON");
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

TektronixAFG.prototype.setBurstNCycles = function( channel, ncycles ) {

	channel = getChannel( channel );
	ncycles = getNumber( ncycles );

	this.command("SOURCE" + channel + ":BURST:NCYCLES " + ncycles );
}

TektronixAFG.prototype.turnChannelOn = function( channel ) {

	channel = getChannel( channel );
	this.command("OUTPUT" + channel + ":STATE ON");
}

TektronixAFG.prototype.enableChannel = TektronixAFG.prototype.turnChannelOn;

TektronixAFG.prototype.enableChannels = function() {
	this.turnChannelOn( 1 );
	this.turnChannelOn( 2 );
}

TektronixAFG.prototype.turnChannelOff = function( channel ) {

	channel = getChannel( channel );
	this.command("OUTPUT" + channel + ":STATE OFF");
}

TektronixAFG.prototype.disableChannel = TektronixAFG.prototype.turnChannelOff;


TektronixAFG.prototype.disableChannels = function() {
	this.turnChannelOff( 1 );
	this.turnChannelOff( 2 );
}

TektronixAFG.prototype.alignPhases = function() {
	this.command("SOURCE1:PHASE:INITIATE");
}

TektronixAFG.prototype.trigger = function() { // Generates a trigger
	this.command("TRIGger:SEQuence:IMMediate");
}

TektronixAFG.prototype.setTriggerSlope = function( slope ) {
	slope = getFromList( slope, [ ['POS', 'POSITIVE' ], [ 'NEG', 'NEGATIVE'] ] );
	this.command("TRIGGER:SEQUENCE " + slope );
}

TektronixAFG.prototype.setTriggerInternal = function() {
	this.command("TRIGGER:SEQUENCE:SOURCE INTERNAL");
}

TektronixAFG.prototype.setTriggerExternal = function() {
	this.command("TRIGGER:SEQUENCE:SOURCE EXTERNAL");
}
/*
TektronixAFG.prototype.ready = function() {
	this.command( "*OPC" );
	return this.command( "*OPC?" );
}*/


TektronixAFG.prototype.wait = function() {
	this.command( "*WAI" );
}


function getChannel( channel ) {
	if( channel.toLowerCase ) {
		channel = channel.toLowerCase();

		if( channel == "a" ) {
			return 1;
		} else if( channel == "b" ) {
			return 2;
		}
	}

	channel = parseInt( channel );

	if( channel == 1 || channel == 2 ) {
		return channel;
	}

	

	console.trace();
	throw "Channel " + channel + " invalid";
}


function getTime( time ) {

	if( time.toLowerCase ) {
		if( /[0-9.]*(ns|us|ms|s)/.test( time.toLowerCase( ) ) ) {
			return time;
		}
	} else if( typeof time == "number") {
		return time;
	}
	console.trace();
	throw "Time invalid";
}

function getVoltage( voltage ) {

	voltage = parseFloat( voltage );

	if( voltage > 10 || voltage < -10 ) {
		console.trace();
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
		console.trace();
		throw "Invalid percentage";
	}
}

function getFromList( value, list ) {

	var listElement;

	for( var i = 0, l = list.length; i < l ; i ++ ) {

		listElement = list[ i ];

		if( Array.isArray( listElement ) ) {

			for( var j = 0; j < listElement.length; j ++ ) {

				if( listElement[ j ].toLowerCase() == value.toLowerCase() ) {
					return value;
				}
			}

		} else if( listElement.toLowerCase() == value.toLowerCase() ) {
			return value;
		}
	}

	console.trace();
	throw "Could not find element in list";
}

function getShape( shape ) {
	return getFromList( shape, [ ["SIN", "SINUSOID" ], [ "SQU", "SQUARE" ], [ "PULS", "PULSE" ], "RAMP", [ "PRN", "PRNOISE" ], "DC", "SINC", [ "GAUS", "GAUSSIAN" ], [ "LOR", "LORENTZ" ], ["ERIS", "ERISE"], ["EDEC", "EDECAY"], ["HAVERSINE"] ]);
}

module.exports = TektronixAFG;
