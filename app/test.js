

var net = require('net');
/*var socket = net.createConnection(1861, '128.178.56.4', {
	allowHalfOpen: false
});
*/

var vxiTransceiver = require('vxi11').vxiTransceiver

vxiTransceiver('128.178.56.4', 'LCRY3505N05226', 'C1:VDIV 2\n', function(result) {
	console.log('SOMERESULT');
  console.log('result: »' + result + '«');
}, function( err ) {
	console.log(err)
});


/*

socket.on('connect', function() {
	var s = this;
console.log('connected');


	socket.write('C1:VDIV 2');
	socket.on('data', function( buffer ) {
	//	console.log( "Received:" + buffer.toString('ascii') );
	});

	socket.on('end', function( buffer ) {
		console.log(buffer );
	//	console.log( "Received:" + buffer.toString('ascii') );
	});


	socket.on('error', function( buffer ) {
		console.log('Error');
		console.log(buffer );
	//	console.log( "Received:" + buffer.toString('ascii') );
	});


	socket.on('close', function( buffer ) {
		console.log('Close');
		console.log(buffer );
	//	console.log( "Received:" + buffer.toString('ascii') );
	});
	




});

*/