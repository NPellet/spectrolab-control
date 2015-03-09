
"use strict";

var net = require('net'),
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform");



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
				complianceI: 1,
				nbPoints: 100
			},

			method: 'LinVSweepMeasureI',
			parameters: function( options ) {

				return [ options.channel, options.startV, options.stopV, options.settlingTime, options.timeDelay, options.complianceI, options.nbPoints ]
			},

			processing: function( data, options ) {

				var w = new Waveform();
				var current, voltage, dataFinal = [];
				data = data.split(/,[\t\r\s\n]*/);
				for( var i = 0; i < data.length; i += 2 ) {
					dataFinal.push( parseFloat( data[ i ] ) );
				}

				w.setData( dataFinal );
				w.setXScaling( options.startV, ( ( options.stopV - options.startV ) / ( options.nbPoints - 1 ) ) );


				return w;
			}
		},


	'measureVoc': {
		defaults: {
			channel: 'smua',
			settlingTime: 0.02
		},

		method: 'measurevoc',
		parameters: function( options ) {
			return [ options.channel, options.settlingTime ]
		},

		processing: function( data ) {

			return parseFloat( data );
		}
	},


	'measureIsc': {
		defaults: {
			channel: 'smua',
			settlingTime: 0.02
		},

		method: 'measurejsc',
		parameters: function( options ) {

			return [ options.channel, options.settlingTime ]
		},

		processing: function( data ) {
console.log("Data: ", data );
			return parseFloat( data );
		}
	},


	'applyVoltage': {
		defaults: {
			bias: 0,
			channel: 'smua'
		},

		method: 'applyvoltage',
		parameters: function( options ) {
			return [ options.channel, options.bias ]
		}
	},


	'VoltageStability': {
		defaults: {
			channel: 'smua',
			settlingtime: 0.04,
			totaltime: 10,
			complianceI: 1,
			complianceV: 2,
			bias: 0
		},

		method: 'VoltageStability',
		parameters: function( options ) {
			return [ options.channel, options.bias, options.settlingtime, options.totaltime, options.complianceV, options.complianceI ]
		},

		processing: function( data, options ) {

			var w = new Waveform();
			w.setXScalingDelta( 0, options.settlingtime );
			w.setXUnit( 's' );
			w.setYUnit( 'V' );

			var dataFinal = [];
			data = data.split(/,[\t\r\s\n]*/);
			for( var i = 0; i < data.length; i ++ ) {
				dataFinal.push( parseFloat( data[ i ] ) );
			}

			w.setData( dataFinal );
			return w;
		}
	},


	'CurrentStability': {
		defaults: {
			channel: 'smua',
			settlingtime: 0.04,
			totaltime: 10,
			complianceI: 1,
			complianceV: 2,
			bias: 0
		},

		method: 'CurrentStability',
		parameters: function( options ) {
			return [ options.channel, options.bias, options.settlingtime, options.totaltime, options.complianceV, options.complianceI ]
		},

		processing: function( data, options ) {



			var w = new Waveform();
			w.setXScalingDelta( 0, options.settlingtime );
			w.setXUnit( 's' );
			w.setYUnit( 'A' );

			var dataFinal = [];
			data = data.split(/,[\t\r\s\n]*/);
			for( var i = 0; i < data.length; i ++ ) {
				dataFinal.push( parseFloat( data[ i ] ) );
			}

			w.setData( dataFinal );
			return w;
		}
	},



	'HallMeasurement': {
		defaults: {
			channel: 'smua',
			bias: 1e-9
		},

		method: 'HallMeasurement',
		parameters: function( options ) {
			return [ options.channel, options.bias ]
		},

		processing: function( data, options ) {

			var w = new Waveform();
			var dataFinal = [];
			data = data.split(/,[\t\r\s\n]*/);
			for( var i = 0; i < data.length; i ++ ) {
				dataFinal.push( parseFloat( data[ i ] ) );
			}
			w.setData( dataFinal );

			return w;
		}
	},


	'Poling': {
		defaults: {
			channel: 'smua',
			peakVoltage: 10,
			peakTime: 2,
			relaxationTime: 10,
			nbIterations: 10
		},

		method: 'Poling',
		parameters: function( options ) {
			return [ options.channel, options.peakVoltage, options.peakTime, options.relaxationTime, options.nbIterations ]
		},

		processing: function( data, options ) {

			var w = new Waveform();
			var dataFinal = [];
			data = data.split(/,[\t\r\s\n]*/);
			for( var i = 0; i < data.length; i ++ ) {
				dataFinal.push( parseFloat( data[ i ] ) );
			}

			w.setXScalingDelta( 0, 0.1 );
			w.setXUnit("s");
			w.setYUnit("V");

			w.setData( dataFinal );

			return w;
		}
	},


	'Sine': {
		defaults: {
			channel: 'smua',
			sense: "Current",
			bias: 0,
			level: 1,
			complianceI: 1e-6,
			complianceV: 10,
			settlingTime: 0.01,
			nplc: 0.01,
			points: 1000
		},

		method: 'SineAmperemetryIV',
		parameters: function( options ) {
			return [ options.channel, '"' + options.sense + '"', options.bias, options.level, options.complianceI, options.complianceV, options.settlingTime, options.nplc, options.points ]
		},

		processing: function( data, options ) {

			var voltage = new Waveform();
			var current = new Waveform();

			var voltageFinal = [];
			var currentFinal = [];

			data = data.split(/,[\t\r\s\n]*/);

			for( var i = 0; i < data.length; i += 3 ) {
				voltageFinal.push( parseFloat( data[ i ] ) );
				currentFinal.push( parseFloat( data[ i + 1 ] ) );
			}

			voltage.setXScalingDelta( 0, options.settlingtime );
			voltage.setXUnit("s");
			voltage.setYUnit("V");

			current.setXScalingDelta( 0, options.settlingtime );
			current.setXUnit("s");
			current.setYUnit("A");

			voltage.setData( voltageFinal );
			current.setData( currentFinal );

			return [ voltage, current ];
		}
	},


	'pulseAndSwitchDiogio': {

		defaults: {
			diodePin: 1,
			switchPin: 2,
			pulseWidth: 0.1,
			numberOfPulses: 1,
			delayBetweenPulses: 1,
			delaySwitch: 0.1
		},

		method: 'pulseAndSwitchDiogio',
		parameters: function( options ) {

			return [ options.diodePin, options.switchPin, options.pulseWidth, options.numberOfPulses, options.delayBetweenPulses, options.delaySwitch ]
		},

		processing: function( data, options ) {

			return data;
		}
	},


		'longPulse': {

			defaults: {
				diodePin: 1,
				pulseWidth: 1,
				numberOfPulses: 1,
				delay: 5
			},


			method: 'longPulse',
			parameters: function( options ) {
				return [ options.diodePin, options.pulseWidth, options.numberOfPulses, options.delay ];
			},

			processing: function( data, options ) {
				return data;
			}
		}

}

var Keithley = function( params ) {
	this.params = params;
	this.connected = false;
	this.queue = [];
};

Keithley.prototype = new events.EventEmitter;

Keithley.prototype.connect = function( callback ) {

	var module = this;

	return new Promise( function( resolver, rejecter ) {

		// Avoid multiple connection
		if( module.connected ) {

			module.socket.removeAllListeners( 'data' );


			if( callback ) {
				callback();
			}

			resolver();
			return;
		}

		if( module.connecting ) {

			module.queue.push( resolver );
			return;
		}



		try {
			// Connect by raw TCP sockets

			var self = module,


				socket = net.createConnection( {
					port: module.params.port,
					host: module.params.host,
					allowHalfOpen: true
				});

			module.connecting = true;
			module.socket = socket;
			module.setEvents( );
			module.queue.push( resolver );

		} catch( error ) {

			module.emit("connectionerror");
			rejecter( error );
		}

	} );
};


for( var i in methods ) {

	( function( j ) {

		Keithley.prototype[ j ] = function( options ) {
			return this._callMethod( methods[ j ], options );
		}

	}) ( i );

}


Keithley.prototype._callMethod = function( method, options ) {

	var module = this;

	return this.connect().then( function() {
		return new Promise( function( resolver, rejecter ) {

			options = extend( true, {}, method.defaults, options );

			if( typeof options == "function" ) {
				callback = options;
				options = {};
			}

			function end( data ) {
				if( method.processing ) {
					data = method.processing( data, options );
				}
				resolver( data );
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


			module.socket.write( method.method + "(" + method.parameters( options ).join() + ");\r\n");
		});
	});

}

Keithley.prototype.command = function( command ) {

	var module = this;

	return this.connect().then( function() {

		return new Promise( function( resolver, rejecter ) {

			module.socket.write( command + "\r\n", function() {

				resolver();
			});
		});
	});
}

Keithley.prototype.setDigioPin = function( pin, bln ) {
		bln = bln ? 1 : 0;
		this.command("digio.writebit( " + pin + ", " + bln + " )");
}


Keithley.prototype.flushErrors = function() {

	this.command("errorqueue.clear();");
}

Keithley.prototype.checkConnection = function() {

	if( ! this.socket && this.connected ) {

		throw "Socket is not alive";
	}
}


Keithley.prototype.setEvents = function() {

	this.checkConnection();

	var self = this;

	this.socket.on('connect', function() {
		self.uploadScripts();
		self.connected = true;
		self.connecting = false;

		self.socket.removeAllListeners( 'data' );

		self.flushErrors();

		self.command("*RST"); // Reset keithley
		self.command("digio.writeport(0)");
	//	self.command("format.data=format.REAL32");
		self.command("format.byteorder=format.LITTLEENDIAN");

		self.socket.write("SpetroscopyScripts();\r\n");
		self.emit("connected");

		self.queue.map( function( resolver ) {
			resolver();
		});

		self.queue = [];
	});

	this.socket.on('end', function() {
		console.log('Keithley is being disconnected');
		module.socket.removeAllListeners( 'data' );
		self.emit("disconnected");
	});
}

Keithley.prototype.uploadScripts = function() {

	this.checkConnection();

	this.socket.write("loadscript SpetroscopyScripts\r\n");

	// Voltage sourcing, current measurement
	var files = fs.readdirSync( path.resolve( __dirname, "scripts/" ) );


	for( var i = 0; i < files.length ; i ++ ) {
		if( files[ i ].substr( 0, 1 ) == '_' ) {
			continue;
		}

		console.log("Uploading script: " + files[ i ] );
		this.socket.write( fs.readFileSync( path.resolve( __dirname, "scripts/", files[ i ] ) ) );
		this.socket.write("\r\n");
	}

	this.socket.write("endscript\r\n");
	this.socket.write("SpetroscopyScripts.save()\r\n");
}

module.exports = Keithley;
