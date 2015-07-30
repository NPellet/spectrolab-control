
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

var CoherentOBIS = function( params ) {
	this.params = params;

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
	this.serialCommand("SOURce:AM:INTernal CWP");
}

CoherentOBIS.prototype.turnOn = function() {	
	this.serialCommand("SOURce:AM:STATe ON");
}

module.exports = CoherentOBIS;
