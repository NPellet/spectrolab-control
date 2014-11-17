
var net = require('net');

var Keithley = function( params ) {
	this.params = params;
};

Keithley.prototype = {};

Keithley.prototype.connect = function( callback ) {

	var self = this,
		socket = net.createConnection( {
			port: this.params.port, 
			host: this.params.host,
			allowHalfOpen: true
		});

	this.socket = socket;

	socket.on('connect', function() {


 		socket.write("eventlog.enable = 1;errorqueue.clear();\r\n");
//		socket.write("smua.source.output = smua.OUTPUT_ON;");
//	 	socket.write("print( smua.measure.i() );\r\n", 'ascii');

		socket.write("loadscript NormanScripts\r\n");

			socket.write("function sourcev(channel,bias,stime,complianceV,complianceI)\r\n");	// SOURCEV()
				socket.write("if channel == nil then channel = smua end\r\n");	// Default to smua if no smu is specified.
				socket.write("if bias == nil then bias = 0 end\r\n");	// Default to 0.0 A
				socket.write("if stime == nil then stime = 0.04 end\r\n");	// Default settlingtime = 0.04 s
				socket.write("if complianceV == nil then complianceV = 1 end\r\n");	// Default compliance = 1 V
				socket.write("channel.source.func = channel.OUTPUT_DCVOLTS\r\n");
				socket.write("channel.source.levelv=bias\r\n");
				socket.write("channel.source.rangev=complianceV\r\n");
				socket.write("channel.measure.rangei = complianceI\r\n");
				socket.write("channel.source.limiti = complianceI\r\n");
				socket.write("channel.source.output = channel.OUTPUT_ON\r\n");
				socket.write("delay(stime)\r\n");
				socket.write("current=channel.measure.i()\r\n");
				socket.write("channel.source.output = channel.OUTPUT_OFF\r\n");
				socket.write("printnumber (current)\r\n");	// Binary output
			socket.write("end\r\n");

		socket.write("endscript\r\n");

		socket.write("NormanScripts.save()\r\n");
		socket.write("NormanScripts()\r\n");

		socket.write("sourcev(smua, 0.1, 1, 1, 1 );\r\n");

		socket.on('data', function( data ) {
			console.log( data.toString( 'ascii' ) );
		});
	});

	if( callback ) {
		callback();
	}
};

Keithley.prototype.sourceV = function( bias, options ) {

}



module.exports = Keithley;