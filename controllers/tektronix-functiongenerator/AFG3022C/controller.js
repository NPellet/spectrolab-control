
"use strict";

var
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform");

var pythonShell = require("python-shell"); // Used to communicate through VXI11 with the Tektronix AFG

var TektronixAFG = function( params ) {
	this.params = params;
	this.connected = false;
	this.queue = [];


	var self = this;
	function *runCommands( queue ) {

		while( true ) {

				while( queue.length == 0 ) {

					self.emit("queueEmpty");
					yield;
				}

				var running = true;

				var element = queue.shift();
				query( self.shellInstance, element.command ).then( function( data ) {

					element.promiseResolve();

				}/*, function( error ) {
					console.log('sdf');
					element.promiseReject();

				} */).finally( function() {
console.log( self.queue );
					running = false;
					self.commandRunner.next();

				});

				yield;

				// Does nothing if next is called and the process is running already
				while( running ) {
					yield;
				}
		}
	}


	this.commandRunner = runCommands( this.queue );
	this.runCommands();
};


TektronixAFG.prototype = new events.EventEmitter;

TektronixAFG.prototype.connect = function(  ) {

		var module = this;

		return new Promise( function( resolver, rejecter ) {

			// Avoid multiple connection
			if( module.connected ) {
				callback();
				return;
			}

			console.log( "Trying to connect to host " + module.params.host + " via VXI11" );

			// Launches a python instance which will communicate in VXI11 with the scope
			module.shellInstance = new pythonShell( 'io.py', {
				scriptPath: path.resolve( 'server/util/vxi11/' ),
				args: [ module.params.host ], // Pass the IP address
				mode: "text" // Text mode
			} );

		/*	module.shellInstance.on("message", function( data ) {
				console.log( data );
			})
*/

			// At this point we are already connected. No asynchronous behaviour with python
			module.connected = true;

			setTimeout( function() {

				module.command( "*IDN?" ).then(function( response ) {

					console.log( response );
				})

				resolver( module );

		} , 1000 );


		} );

	}

	TektronixAFG.prototype.runCommands = function() {
		this.commandRunner.next();
	}

	TektronixAFG.prototype.command = function( command ) {

		var self = this;

		return new Promise( function( resolver, rejecter ) {

			self.queue.push( {

				command: command,
				promiseResolve: resolver,
				promiseReject: rejecter
			} );

			self.runCommands();
		});
	}

	TektronixAFG.prototype.commands = function( commands ) {
		var self = this;
		commands.map( function( cmd ) {
			self.command(cmd);
		} );
	}


function query( shellInstance, query ) {

			var queries = shellInstance.queries;
			var ask = query.indexOf('?') > -1;

			return new Promise( function( resolver, rejecter ) {
				console.log( "Query:" + query );
				if( ask ) {

					function listen( prevData ) {
console.log('listening');
						shellInstance.once( 'message', function( data ) {
							console.log("Chunk:" + data);

							data = prevData + data.toString('ascii');

						/*	if( data.indexOf("\n") == -1 ) {
								console.log('NThr');
								listen( data );
							} else {*/
console.log('Thr', data);
								//if( data.indexOf( query	 ) == 0 ) { // The response is exactly what has been requested
									resolver( data );
								//} else {
								//	console.log( 'Rejection');
								//	rejecter("The oscilloscope response was unexpected. Message : " + data);
								//}
							//}

						} );
					}

					listen("");

					shellInstance.send( query );

				} else {

					shellInstance.send( query );
					resolver();
				}

			} ).then( function( data ) {
				if( data ) {
					return data.replace("\n", "");
				}
			} );
}



module.exports = TektronixAFG;
