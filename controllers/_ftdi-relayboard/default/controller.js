
"use strict";


var ftdi = require('ftdi');

var extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform");




function doConnect( ftdirelay, resolver ) {

	try {



		var deviceOpened;

		var settings = {
			'baudrate': 9600,
			'databits': 8,
			'stopbits': 1,
			'parity'  : 'none',
			bitmask: 0xFF,
			bitmode: 0x04 // Synchronous bit mode
		};


		ftdi.find(function(err, devices){

			var device = new ftdi.FtdiDevice(devices[0]);
			ftdirelay.device = device;


			device.open(settings, function( err ) {
				ftdirelay.currentState = 0x00;
				device.write([ currentState ], function(err) {

					resolver();
				});
			});
		});

	} catch ( error ) {
		console.log( error );
		throw "Error while connecting to the FTDI";

		ftdirelay.emit("connectionerror");
		rejecter();
	}

	//setEvents( arduino, resolver );
}

var FTDIRelayBoard = function( params ) {
	this.params = params;
	this.connected = false;
	this.currentState;
	this.queue = [];
};



FTDIRelayBoard.prototype = new events.EventEmitter;

FTDIRelayBoard.prototype.connect = function( ) {

	var module = this;

	return new Promise( function( resolver, rejecter ) {

		if( module.connected ) {
			resolver( module.serialPort );
			module.connected = true;
			module.emit("idle");
			return;
		}

		module.emit("busy");


		doConnect( module, resolver );

	} );
};

FTDIRelayBoartd.prototype.switchRelay = function( relayId, state, callback ) {

	var output = this.currentState;
	switch( relayId ) {
        case 1:
            relay = 0x01;
        break;

        case 2:
            relay = 0x02;
        break;

        case 3:
            relay = 0x04;
        break;

        case 4:
            relay = 0x08;
        break;

        case 5:
            relay = 0x10;
        break;

        case 6:
            relay = 0x20;
        break;

        case 7:
        	relay = 0x40;
        break;

        case 8:
        	relay = 0x80;
        break;
    }

    switch (state) {
        case 1:
            output = (output | relay);
        break;
        case 0:
            output = (output & ~(relay));
        break;
    }

    this.currentState = output;
		var self = this;
		return new Promise( function( resolver ) {

			self.device.write([ output ], function() {
				resolver();
			});

		})

}

module.exports = FTDIRelayBoard;
