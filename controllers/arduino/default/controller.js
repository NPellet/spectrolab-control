
"use strict";


var SerialPort = require('serialport').SerialPort,
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform");

var InstrumentController = require("../../serialinstrumentcontroller");


var timeout;

var Arduino = function( params ) {
	this.params = params;

	this.serialSetHost( params.host );
	this.serialSetBaudrate( params.baudrate );
	this.serialSetOptions( params.options );
};

Arduino.prototype = new InstrumentController();

Arduino.prototype.connect = Arduino.prototype.serialConnect;

Arduino.prototype.readDigital = function( pinNumber ) {

	var self = this;
	return this
		.serialCommand( "6," + pinNumber + ";" )
		.then( function ( d ) { return self.parseCommandResponse( d ); } )
		.then( function( d ) {
			
			if( d === undefined ) {
				return NaN;
			}

			return parseInt( d[ 0 ] );
		});
}


Arduino.prototype.readAnalog = function( pinNumber ) {

	var self = this;
	return this
		.command( "7," + pinNumber + ";" )
		.then( function( d ) {
			
			if( d === undefined ) {
				return NaN;
			}
			return parseFloat( d[ 0 ] );
		});
}

Arduino.prototype.setDigital = function() {

	return this.command( "8," + pinNumber + "," + pinValue + ";" );
}



/** DEVICES **/

Arduino.prototype.enableDevice = function( deviceId ) {

	if( this.enabledDevice == deviceId ) {
		return;
	}

	this.disableDevices();
	if( this.params.digital.devices[ deviceId ] ) {
		this.enabledDevice = deviceId;
		return this.setDigital( this.params.digital.devices[ deviceId ], 1 );	
	}	
}

Arduino.prototype.disableDevices = function() {

	for( var i = 0; i < this.params.digital.devices.length; i ++ ) {
		this.setDigital( this.params.digital.devices[ i ], 0 );
	}
}


/** ROUTING **/


Arduino.prototype.bypassLEDCard = function() {
	// 0 == bypass, 1 == use
	this.setDigital( this.params.digital.LEDCard.bypassAFG, 0 );
}

Arduino.prototype.routeLEDToAFG = function( color, output ) {

	if( color = this._checkLEDColor( color ) ) {
		// Turn ON the AFG routing for this LED
		// Automatically turns off routing from Arduino
		this.setDigital( this.params.digital.LEDCard.colors[ color ], 1 );
	}

	// Do not bypass the AFG to next card (0 = bypass, 1 = route through LED card)
	this.setDigital( this.params.digital.LEDCard.bypassAFG, 1 );

	// If the input is on channel B, we need to turn on the inverter relay
	// If B, then A is routed to its bypass. If A, then B is routed to its bypass
	this.setDigital( this.params.digital.LEDCard.inverter, output == "B" );
}


Arduino.prototype.routeLEDToArduino = function( color, output ) {

	if( color = this._checkLEDColor( color ) ) {
		// Turn ON the Arduino routing for this LED
		// Automatically turns off routing from AFG
		this.setDigital( this.params.digital.LEDCard.colors[ color ], 0 );
	}
}




"digital": {
	"LEDCard": {
		"bypassAFG": 51,
		"inverter": 49,
		"colors": {
			"white": 47,
			"red": 45,
			"green": 43,
			"blue": 41
		}
	}
}











Arduino.prototype.command = function() {
	return this
		.serialCommand( cmd )
		.then( function( d ) {
			return self._parseCommandResponse( d );
		} );
}

Arduino.prototype._parseCommandResponse = function( response ) {

	response = response.replace(';\r\n', '');
	response = response.split(',');
	if( response[ 0 ] !== '4' ) {
		this.logError( "An unexpected response has occured. Arduino should respond with command '4' to be valid" );
		this.logError( "Returned command: " + response );
		return;
	} else {

		response.shift();
		return response;
	}
}



module.exports = Arduino;
