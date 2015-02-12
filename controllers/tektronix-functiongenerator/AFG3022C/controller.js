
"use strict";

var net = require('net'),
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	promise = require("bluebird"),
	Waveform = require("../../../server/waveform");

var TektronixAFG = function( params ) {
	this.params = params;
	this.connected = false;
	this.queue = [];
};

TektronixAFG.prototype = new events.EventEmitter;

TektronixAFG.prototype.connect = function( callback ) {

	var module = this;

	return new Promise( function( resolver, rejecter ) {

		// Avoid multiple connection
		if( module.connected ) {

			console.log('Already connected. Remove all TektronixAFG listeners');
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

			console.log( module.params );
			// Connect by raw TCP sockets
			var self = module,
				socket = net.createConnection( {
					port: module.params.port,
					host: module.params.host,
					allowHalfOpen: true
				});

			module.connecting = true;
			module.socket = socket;
			module.setEvents();


			resolver();

		} catch( error ) {

			module.emit("connectionerror");
			rejecter();
		}

	} );
};



TektronixAFG.prototype._callMethod = function( method, options ) {

	var module = this;

	return this.connect().then( function() {

		return new Promise( function( resolver, rejecter ) {

			options = extend( true, {}, method.defaults, options );

			if( typeof options == "function" ) {
				callback = options;
				options = {};
			}

			function end( data ) {
console.log( data );
				if( method.processing ) {
					data = method.processing( data, options );
				}

				resolver( data );
			}

			function listen( prevData ) {

				module.socket.once( 'data', function( data ) {
					console.log( "Chunk: " + data.toString('ascii'));
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

TektronixAFG.prototype.command = function( command ) {

	var module = this;

	return this.connect().then( function() {

		return new Promise( function( resolver, rejecter ) {
console.log( command );
			module.socket.write( command + "\r\n", function() {

				resolver();
			});
		});
	});
}

TektronixAFG.prototype.flushErrors = function() {

	this.command("errorqueue.clear();");
}

TektronixAFG.prototype.checkConnection = function() {

	if( ! this.socket && this.connected ) {

		throw "Socket is not alive";
	}
}


TektronixAFG.prototype.setEvents = function() {

	this.checkConnection();

	var self = this;

	this.socket.on('connect', function() {

		self.connected = true;
		self.connecting = false;

		console.log('Remove all TektronixAFG listeners');
		self.socket.removeAllListeners( 'data' );

		self.emit("connected");


		self.socket.on( 'data', function( data ) {
			console.log( "Chunk: " + data.toString('ascii'));
		} );

		self.command("*IDN?");


		self.queue.map( function( resolver ) {
			resolver();
		});

		self.queue = [];
	});

	this.socket.on('end', function() {
		console.log('TektronixAFG is being disconnected');
		module.socket.removeAllListeners( 'data' );
		self.emit("disconnected");
	});

}

module.exports = TektronixAFG;
