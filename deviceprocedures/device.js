
var Device = {};
var methods = {};
var currentMethod;

var EventEmitter = require('events').EventEmitter;
var Promise = require("bluebird");

Device = new EventEmitter();

Device.method = function( methodName, methodOptions ) {

	if( methods[ methodName ] ) {
		throw "Cannot add a second method with name " + methodName;
	}

	var experiment = require( "./experiments/" + methodName.toLowerCase( ) );
	experiment.init( methodOptions );

	experiment.progress = function() {

		arguments = Array.prototype.slice.call( arguments );
		arguments.unshift( "progress" );
		Device.emit.apply( Device, arguments );
	};

	experiment.done = function() {
		arguments = Array.prototype.slice.call( arguments );
		arguments.unshift( "done" );
		Device.emit.apply( Device, arguments );
	}

	experiment.next = function() {

		if( ! experiment._paused ) {
			experiment.iterator.next();
		} else {
			experiment.paused();
		}
	}

	experiment.waitAndNext = function( time ) {

		experiment.wait( time ).then( function() {
			experiment.next();
		} );
	}

	experiment.wait = function( time ) {

		return new Promise( function( resolver, rejecter ) {
			setTimeout( resolver, time * 1000 );
		} );
	}

	currentMethod = methodName;
	methods[ methodName ] = experiment;
	return this;
}

Device.run = function( methodName ) {

	if( methods[ methodName || currentMethod ] ) {

		methods[ methodName || currentMethod ].run();
	}

}

Device.pause = function( ) {

	return new Promise( function( resolver, rejecter ) {
		methods[ currentMethod ]._paused = true;
		methods[ currentMethod ].paused = function() {
			resolver();
		}
	} );
}


Device.resume = function( methodName ) {
	if( methods[ currentMethod ]._paused ) {
		methods[ currentMethod ]._paused = false;
		methods[ currentMethod ].iterator.next();
	}
}

Device.abort = function( ) {
	return new Promise( function( resolver, rejecter ) {
		methods[ currentMethod ]._paused = true;
		methods[ currentMethod ].paused = function() {
			resolver();
		}
	} );
}

Device.config = function( cfgName, cfg ) {

	if( methods[ currentMethod ].config && methods[ currentMethod ].config[ cfgName ] ) {
		return methods[ currentMethod ].config[ cfgName ].apply( methods[ currentMethod ], cfg );
	}
}


module.exports = Device;
