
"use strict";


var SerialPort = require('serialport').SerialPort,
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	Promise = require("bluebird"),
	Waveform = require("../../../server/waveform");

var InstrumentController = require("../../serialinstrumentcontroller");


var timeout;

var CoherentOBIS = function( params ) {
	this.params = params;

	this.mode;
	this.turnedOn;

	this.serialSetHost( params.host );
	this.serialSetBaudrate( params.baudrate );
	this.serialSetOptions( params.options );
};

CoherentOBIS.prototype = new InstrumentController();

CoherentOBIS.prototype.connect = CoherentOBIS.prototype.serialConnect;


CoherentOBIS.prototype.setLaserPower = function( power ) {
	this.serialCommand("SOURce:POWer:LEVel:IMMediate:AMPLitude " + power );
}

CoherentOBIS.prototype.setContinuousMode = function( mode ) {

	var self = this;
	if( this.mode == "continuous" ) {
		return new Promise( function( resolver ) { resolver(); });
	}

	this.serialCommand("SOURce:AM:STATe ON");
	this.serialCommand("SOURce:AM:INTernal CWP").then( function() {
		self.mode == "continuous";
	});
}



CoherentOBIS.prototype.turnOn = function() {	

	var self = this;
	if( this.turnedOn === true ) {
		return new Promise( function( resolver ) { resolver(); });
	}
	
	this.serialCommand("SOURce:AM:STATe ON").then( function() {
		self.turnedOn = true;
	});
}

CoherentOBIS.prototype.turnOff = function() {	

	var self = this;

	if( this.turnedOn === false ) {
		return new Promise( function( resolver ) { resolver(); });
	}
	
	this.serialCommand("SOURce:AM:STATe OFF").then( function() {
		self.turnedOn = true;
	});
}

module.exports = CoherentOBIS;
