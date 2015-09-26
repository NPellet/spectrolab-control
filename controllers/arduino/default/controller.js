
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
			.serialCommand( "7," + pinNumber + ";" )
			.then( function ( d ) { return self.parseCommandResponse( d ); } )
			.then( function( d ) {
				
				if( d === undefined ) {
					return NaN;
				}

				return parseFloat( d[ 0 ] );
			});
}


Arduino.prototype.parseCommandResponse = function( response ) {

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
