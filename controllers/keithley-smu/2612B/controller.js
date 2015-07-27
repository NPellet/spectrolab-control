
"use strict";

var net = require('net'),
	extend = require('extend'),
	fs = require('fs'),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform"),
	IV = require("../../../server/iv");

var InstrumentController = require("../../instrumentcontroller");


var methods = {

	'sourcev': {
		defaults: {
			bias: 0,
			channel: 'smua',
			complianceV: 1
		},

		method: 'sourcev',
		parameters: function( options ) {
			return [ options.channel, options.bias, options.complianceV ]
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
			nbPoints: 100,
			hysteresis: false
		},

		method: 'LinVSweepMeasureI',
		parameters: function( options ) {

			if( options.scanRate ) {
					options.settlingTime = Math.abs( options.stopV - options.startV ) / options.scanRate / options.nbPoints;
			}
			return [ options.channel, options.startV, options.stopV, options.settlingTime, options.timeDelay, options.complianceI, options.nbPoints, options.hysteresis ? 1 : 0 ]
		},

		processing: function( data, options ) {

			var iv = new IV();
			var current, voltage;
			data = data.split(/,[\t\r\s\n]*/);

			function getIv( from, to ) {
				var w = new Waveform();
				var waveX = new Waveform();

				var dataFinal = [], dataFinalX = [];

				for( var i = from; i < to; i += 2 ) {
					dataFinal.push( parseFloat( data[ i ] ) );
					dataFinalX.push( parseFloat( data[ i + 1 ] ) );
				}

				w.setData( dataFinal );
				waveX.setData( dataFinalX );
				w.setXWave( waveX );

				iv.setBackward( w );
				return w;
			}

			if( options.hysteresis ) {
				if( data.length > 2 ) {
					var iv1 = getIv( 0, data.length / 2 );
					var iv2 = getIv( data.length / 2, data.length );

					if( iv1.getXFromIndex( 0 ) - iv1.getXFromIndex( 1 ) < 0 ) {

						iv.setBackward( iv1 );
						iv.setForward( iv2 );

					} else {

						iv.setForward( iv1 );
						iv.setBackward( iv2 );

					}
				}

			} else {

				var iv1 = getIv( 0, data.length );
				if( iv1.getXFromIndex( 0 ) - iv1.getXFromIndex( 1 ) < 0 ) {
					iv.setBackward( iv1 );
				} else {
					iv.setForward( iv1 );
				}
			}

			return iv;

		}
	},


	'measureVoc': {
		defaults: {
			channel: 'smua',
			settlingTime: 0.02,
			current: 0,
			complianceV: 5
		},

		method: 'measurevoc',
		parameters: function( options ) {
			return [ options.channel, options.settlingTime, options.current, options.complianceV ]
		},

		processing: function( data ) {

			return parseFloat( data );
		}
	},


		'measureJ': {
			defaults: {
				channel: 'smua',
				settlingTime: 0.02,
				voltage: 0
			},

			method: 'measurej',
			parameters: function( options ) {

				return [ options.channel, options.settlingTime, options.voltage ]
			},

			processing: function( data ) {
				return parseFloat( data );
			}
		},

		'MPPTracking': {
			defaults: {
				channel: 'smua',
			},

			method: 'MPPTracking',
			parameters: function( options ) {

				return [ options.channel ]
			},

			processing: function( data ) {

				var current, voltage;
				data = data.split(/,[\t\r\s\n]*/);

				var iv = new Waveform();
				var it = new Waveform();
				var vt = new Waveform();
				var pt = new Waveform();

				var time = new Waveform();
				var voltage = new Waveform();

				var v = new Waveform();
				var c = [], v = [], t = [];

				for( var i = 0; i < data.length; i += 3 ) {
					c.push( parseFloat( data[ i ] ) );
					v.push( parseFloat( data[ i + 1 ] ) );
					t.push( parseFloat( data[ i + 2 ] ) );
				}

				time.setData( t );
				voltage.setData( v );

				iv.setData( c );
				iv.setXWave( voltage )

				it.setData( c );
				it.setXWave( time )

				vt.setData( v );
				vt.setXWave( time )

				pt = iv.duplicate().multiplyBy( function( valX ) { return valX; } );
				pt.setXWave( time )

				return {
					IvsV: iv,
					IvsT: it,
					VvsT: vt,
					PvsT: pt
				};
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
		},
		processing: function( data ) {
			return parseFloat( data );
		}
	},

	'applyCurrent': {
		defaults: {
			bias: 0,
			channel: 'smua'
		},

		method: 'applycurrent',
		parameters: function( options ) {
			return [ options.channel, options.bias ]
		},
		processing: function( data ) {
			return parseFloat( data );
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


	'pulseAndSwitchDigio': {

		defaults: {
			diodePin: 1,
			switchPin: 2,
			pulseWidth: 0.1,
			numberOfPulses: 1,
			delayBetweenPulses: 1,
			delaySwitch: 0.1
		},

		method: 'pulseAndSwitchDigio',
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

Keithley.prototype = new InstrumentController();

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

			self.log("Attempting to connect to Keithley");

			module.connecting = true;
			module.socket = socket;

			var timeout = setTimeout( function() {

				module.emit("connectionerror");
				rejecter();
				self.logError("Error while connecting to Keithley. Request timeout. Check that the Keithley is connected and turned on.")
				module.socket.destroy(); // Kills the socket

			}, module.params.timeout || 10000 );


			module.socket.on('connect', function() {

				self.command("ABORT"); // Reset keithley
				self.command("digio.writeport(0)");


				// It's connected...
				clearTimeout( timeout );
				self.uploadScripts();

		//		self.getErrors();

				self.connected = true;
				self.connecting = false;

				self.socket.removeAllListeners( 'data' );

				self.flushErrors();

			//	self.command("format.data=format.REAL32");
				self.command("format.byteorder=format.LITTLEENDIAN");
				self.command("SpetroscopyScripts();");

				self.emit("connected");
				module.logOk("Connected to Keithley on host " + module.params.host + " on port " + module.params.port );

				self.queue.map( function( resolver ) {
					resolver();
				});

				self.queue = [];
			});

			module.socket.on('end', function() {
				console.log('Keithley is being disconnected');
				module.socket.removeAllListeners( 'data' );
				self.emit("disconnected");
			});

			module.socket.on("data", function( d ) {
				console.log( "Keithley response : " );
				console.log( d.toString('ascii') );
				console.log(" End Keithley response");
			})


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
			var self = this;
//			self.getErrors();
			return this._callMethod( methods[ j ], options ).then( function( results ) {
	//			self.getErrors();
				return results;
			});
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
				data = data.replace("\n", "");
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
						console.log( "Return;" );
						end( data );

					}
				} );
			}

			listen("");
			console.log("Method !");
			module.log( "Keithley method: <em>" + method.method + "(" + method.parameters( options ).join() + ");</em>");
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

Keithley.prototype.commandPrint = function( command ) {

	var module = this;
	return this.connect().then( function() {

		return new Promise( function( resolver, rejecter ) {

				function end( data ) {
					data = data.replace("\n", "");
					if( method.processing ) {
						data = method.processing( data, options );
					}
					resolver( data );
				}

				function listen( prevData ) {

					module.socket.once( 'data', function( data ) {
						console.log( ">" + data.toString('ascii') + "< Buffer" );
						data = prevData + data.toString('ascii');
						if( data.indexOf("\n") == -1 ) {
							listen( data );
						} else {
							resolver( data );
						}
					} );
				}

				listen("");
				module.socket.write( command + "\r\n" );
		});
	});
}


Keithley.prototype.setDigioPin = function( pin, bln ) {
		bln = bln ? 1 : 0;
		this.command("digio.writebit( " + pin + ", " + bln + " )");
}

Keithley.prototype.writeDigio = Keithley.prototype.setDigioPin;


Keithley.prototype.flushErrors = function() {

	this.command("errorqueue.clear();");
}

Keithley.prototype.checkConnection = function() {

	if( ! this.socket && this.connected ) {
		throw "Socket is not alive";
	}
}

// NOT STABLE
Keithley.prototype.getErrors = function() {
	return;
	
		var self = this;
		this.commandPrint("print( errorqueue.count );").then( function( errorCount ) {
			console.log("Raw error count: " + errorCount );
			errorCount = parseInt( errorCount );
			console.log( "Error count: " + errorCount );
			for( var i = 0; i < errorCount; i ++ ) {

				self.commandPrint("errorCode, message, severity, errorNode = errorqueue.next(); print( errorCode, message );").then( function( error ) {
					console.log('___');
					console.log( error );
					console.log('----');
				} );
			}
		});
}


Keithley.prototype.uploadScripts = function() {

	try {
		this.checkConnection();
	} catch( e ) {

		return false;
	}

	var func;
	this.socket.write("loadscript SpetroscopyScripts\r\n");

	// Voltage sourcing, current measurement
	var files = fs.readdirSync( path.resolve( __dirname, "scripts/" ) );

	for( var i = 0; i < files.length ; i ++ ) {

		if( files[ i ].substr( 0, 1 ) == '_' || files[ i ].substr( 0, 1 ) == '.' ) {
			continue;
		}

		func = fs.readFileSync( path.resolve( __dirname, "scripts/", files[ i ] ) ).toString( 'ascii' );
		func = func.split("\n");

		var l = 0;
		var b = "";
		for( var m = 0, k = func.length; m < k; m ++ ) {
			if( l + func[ m ].length > 1024 ) {
				this.socket.write( b );
				console.log( b );

				b = "";
				l = 0;

			} else {

				b += func[ m ] + "\n";
				l += func[ m ].length + 2;
			}
		}

		this.socket.write( b );

		//this.socket.write(  );
		this.socket.write("\r\n");
	}


	this.socket.write("endscript\r\n");
	this.socket.write("SpetroscopyScripts.save()\r\n");
}

module.exports = Keithley;
