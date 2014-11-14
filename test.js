var p = require('./params');

var keithley = require('./keithley/main');


var net = require('net');
var socket = net.createConnection(23, '169.254.0.1');
socket.on('connect', function() {
	var s = this;
	s.write("display.clear(); display.settext(\"Good morning, master\");\r\n");
});


s.on('data', function( buffer ) {

	console.log( buffer.toString('ascii') );
});
 s.write("smua.source.output = smua.OUTPUT_ON\r\n");
 //s.write("smua.source.output = smua.OUTPUT_ON\r\n");
 //s.write("smua.source.output = smua.OUTPUT_ON\r\n");
 //s.write("beeper.enable()\r\n");
 s.write("beeper.beep(0.1, 200)\r\n");
 s.write("print( smua.measure.i() )\r\n");


 setTimeout(function() {

 	//s.write("sourcev(smua,0,0.1,0.1,0.02)\r\n");
 	//s.write("smua.source.output = smua.OUTPUT_OFF\r\n");

 }, 1000)


