

var net = require('net');
var socket = net.createConnection(23, '169.254.0.1', {
	allowHalfOpen: true
});

socket.on('connect', function() {
	var s = this;

 //	socket.write("smua.source.output = smua.OUTPUT_ON\r\n");

socket.write('reset(); \r\n');
 	//socket.write('queue.clear(); \r\n');
 	socket.write('smub.source.output = smub.OUTPUT_ON \r\n');
 	socket.write('smub.source.func = smub.OUTPUT_DCAMPS; \r\n');
 	socket.write('display.smub.measure.func = display.MEASURE_DCVOLTS; \r\n');
//	socket.write('smua=smua.measure.i() \r\n');

 	//socket.write('smua.source.func = channel.OUTPUT_DCVOLTS; display.smua.measure.func = display.MEASURE_DCAMPS;\r\n');

 


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

