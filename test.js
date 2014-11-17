

var net = require('net');
var socket = net.createConnection(23, '128.178.56.5', {
	allowHalfOpen: true
});

socket.on('connect', function() {
	var s = this;


 //	socket.write("smua.source.output = smua.OUTPUT_ON\r\n");

 	socket.write('print("Hello");\r\n');

	socket.on('data', function( buffer ) {
		console.log( "Received:" + buffer.toString('ascii') );
	});

	socket.once('data', function( buffer ) {
		console.log( "Received:" + buffer.toString('ascii') );
	});

	socket.once('data', function( buffer ) {
		console.log( "Received:" + buffer.toString('ascii') );
	});


});

