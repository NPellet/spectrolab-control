
"use strict";

var net = require('net'),
	extend = require('extend'),
	fs = require('fs');

var Keithley = function( params ) {
	this.params = params;
	this.connected = false;
};

Keithley.prototype = {};

Keithley.prototype.connect = function( callback ) {

	if( this.connected ) {
		callback();
		return;
	}

	var self = this,
		socket = net.createConnection( {
			port: this.params.port, 
			host: this.params.host,
			allowHalfOpen: true
		});


	this.socket = socket;

	socket.on('connect', function() {

		self.uploadScripts();

		self.connected = true;

		socket.write("SpetroscopyScripts();\r\n");
		//socket.write("sourcev(smua, 0.1, 1, 1, 1 );\r\n");


		if( callback ) {
			callback();
		}
	});

};

var methods = {

	'sourcev': {
		defaults: { 
			bias: 0,
			channel: 'smua',
			complianceV: 1,
			complianceI: 1,
			settlingTime: 1	
		},

		method: 'sourcev',
		parameters: function( options ) {
			return [ options.channel, options.bias, options.settlingTime, options.complianceV, options.complianceI ]
		}
	},


	'sweepIV': {
		defaults: { 
			channel: 'smua',
			startV: 0,
			stopV: 1,
			settlingTime: 0.02,
			timeDelay: 0,
			complianceI: 0.01,
			nbPoints: 100
		},

		method: 'LinVSweepMeasureI',
		parameters: function( options ) {

			return [ options.channel, options.startV, options.stopV, options.settlingTime, options.timeDelay, options.complianceI, options.nbPoints ]
		},

		processing: function( data ) {
			var current, voltage, dataFinal = [];
			data = data.split(/,[\t\r\s\n]*/);
			for( var i = 0; i < data.length; i += 2 ) {
				dataFinal.push( [ parseFloat( data[ i + 1] ), parseFloat( data[ i ] ) ] );
				
			}
			return dataFinal;
		}
	},

	'VoltageStability': {
		defaults: { 
			channel: 'smua',
			settlingtime: 0.04,
			totaltime: 10,
			complianceI: 0.1,
			complianceV: 1,
			bias: 0
		},

		method: 'VoltageStability',
		parameters: function( options ) {

			return [ options.channel, options.bias, options.settlingtime, options.totaltime, options.complianceV, options.complianceI ]
		},

		processing: function( data, options ) {

			var current, voltage, dataFinal = [];
			data = data.split(/,[\t\r\s\n]*/);

			for( var i = 0; i < data.length; i ++ ) {

				dataFinal.push( [ options.settlingtime * i, parseFloat( data[ i ] ) ] );	
			}

			return dataFinal;
		}
	},


	'CurrentStability': {
		defaults: { 
			channel: 'smua',
			settlingtime: 0.04,
			totaltime: 10,
			complianceI: 0.01,
			complianceV: 1,
			bias: 0
		},

		method: 'CurrentStability',
		parameters: function( options ) {

			return [ options.channel, options.bias, options.settlingtime, options.totaltime, options.complianceV, options.complianceI ]
		},

		processing: function( data, options ) {

			var current, voltage, dataFinal = [];
			data = data.split(/,[\t\r\s\n]*/);

			for( var i = 0; i < data.length; i ++ ) {

				dataFinal.push( [ options.settlingtime * i, parseFloat( data[ i ] ) ] );	
			}

			return dataFinal;
		}
	}


}

for( var i in methods ) {

	( function( j ) {

		Keithley.prototype[ j ] = function( options, callback ) {
console.log( methods[ j ] );
			this._callMethod( methods[ j ], options, callback );
		}

	}) ( i );
	
}


Keithley.prototype._callMethod = function( method, options, callback ) {

	var module = this;
	options = extend( true, {}, method.defaults, options );

	if( ! this.connected ) {
		throw "Keithley is not connected";
	}

	if( typeof options == "function" ) {
		callback = options;
		options = {};
	}
	

	function end( data ) {

		if( method.processing ) {
			data = method.processing( data, options );
		}

		callback( data );
	}			

	function listen( prevData ) {

		module.socket.once( 'data', function( data ) {
			data = prevData + data.toString('ascii');
			if( data.indexOf("\n") == -1 ) {
				listen( data );
			} else {
				end( data );
			}
		} );
	}

	listen("");
	this.socket.write( method.method + "(" + method.parameters( options ).join() + ");\r\n");
}


Keithley.prototype.uploadScripts = function() {

	this.socket.write("loadscript SpetroscopyScripts\r\n");

		// Voltage sourcing, current measurement
	var files = fs.readdirSync("./keithley/scripts");
	console.log( files );

	for( var i = 0; i < files.length ; i ++ ) {
		this.socket.write( fs.readFileSync( "./keithley/scripts/" + files[ i ] ) );
		this.socket.write("\r\n");
	}

	this.socket.write("endscript\r\n");
	this.socket.write("SpetroscopyScripts.save()\r\n");
}

module.exports = Keithley;