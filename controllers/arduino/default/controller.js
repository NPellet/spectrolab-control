
"use strict";


var SerialPort = require('serialport').SerialPort,
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird");

var InstrumentController = require("../../serialinstrumentcontroller");


var timeout;

var Arduino = function( params ) {

	this.serialSetHost( params.host );
	this.serialSetBaudrate( params.baudrate );
	this.serialSetOptions( params.options );

	var self = this;

};

Arduino.prototype = new InstrumentController();


Arduino.prototype.onConnectionInit = function() {

	// 1 is OUT
	this.initPin( this.config.digital.LEDCard.relays.bypassAFG, 1 );
	this.initPin( this.config.digital.LEDCard.relays.inverter, 1 );

	for( var i in this.config.digital.LEDCard.relays.colors ) {
		this.initPin( this.config.digital.LEDCard.relays.colors[ i ], 1 );	
	}
	
	for( var i in this.config.digital.LEDCard.colors ) {
		this.initPin( this.config.digital.LEDCard.colors[ i ], 1 );	
	}

}

Arduino.prototype.initPin = function( pinNumber, pinValue ) {
	return this.command( "8," + pinNumber + "," + pinValue + ";", -1 );
}


Arduino.prototype.readDigital = function( pinNumber ) {

	var self = this;
	return this
		.command( "6," + pinNumber + ";" )
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

Arduino.prototype.setDigital = function( pinNumber, pinValue ) {

	return this.command( "5," + pinNumber + "," + pinValue + ";" );
}



/** DEVICES **/

Arduino.prototype.enableDevice = function( deviceId ) {

	if( this.enabledDevice == deviceId ) {
		return;
	}

	this.disableDevices();
	if( this.config.digital.devices[ deviceId ] ) {
		this.enabledDevice = deviceId;
		return this.setDigital( this.config.digital.devices[ deviceId ], 1 );	
	}	
}

Arduino.prototype.disableDevices = function() {

	for( var i = 0; i < this.config.digital.devices.length; i ++ ) {
		this.setDigital( this.config.digital.devices[ i ], 0 );
	}
}


/** ROUTING **/


Arduino.prototype.bypassLEDCard = function() {
	// 0 == bypass, 1 == use
	this.setDigital( this.config.digital.LEDCard.relays.bypassAFG, 0 );
}

Arduino.prototype.routeLEDToAFG = function( color, output ) {


	for( var i in this.config.digital.LEDCard.relays.colors ) {
		this.setDigital( this.config.digital.LEDCard.relays.colors[ i ], 0 );
	}

	if( color = this._checkLEDColor( color ) ) {
		// Turn ON the AFG routing for this LED
		// Automatically turns off routing from Arduino
		this.setDigital( this.config.digital.LEDCard.relays.colors[ color ], 1 );
	}

	// Do not bypass the AFG to next card (0 = bypass, 1 = route through LED card)
	this.setDigital( this.config.digital.LEDCard.relays.bypassAFG, 1 );

	// If the input is on channel B, we need to turn on the inverter relay
	// If B, then A is routed to its bypass. If A, then B is routed to its bypass
	this.setDigital( this.config.digital.LEDCard.relays.inverter, output == "B" );
}


Arduino.prototype.routeLEDToArduino = function( color ) {


	
	if( color = this._checkLEDColor( color ) ) {
		// Turn ON the Arduino routing for this LED
		// Automatically turns off routing from AFG

		// Bypasses the LED card for the AFG
		this.setDigital( this.config.digital.LEDCard.relays.bypassAFG, 0 );

		// 0 is ON for arduino
		this.setDigital( this.config.digital.LEDCard.relays.colors[ color ], 0 );
	}
}

Arduino.prototype.turnLEDOn = function( color ) {

	if( color = this._checkLEDColor( color ) ) {

		this.setDigital( this.config.digital.LEDCard.colors[ color ], 1 ); // Set the pin HIGH
	}
}


Arduino.prototype.turnLEDOff = function( color ) {

	if( color = this._checkLEDColor( color ) ) {
		this.setDigital( this.config.digital.LEDCard.colors[ color ], 0 ); // Set the pin HIGH
	}
}

Arduino.prototype._checkLEDColor = function( color ) {

	if( this.config.digital.LEDCard.colors[ color ] ) {
		return color;
	}

	console.error("Could not find color " + color + ". Returning \"White\"" );
	return "white";
}


/*


*/




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
