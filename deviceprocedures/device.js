
var Device = {};
var methods = {};
var currentMethod;

var EventEmitter = require('events').EventEmitter;

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
Device.pause = function( methodName ) {
	methods[ methodName ].paused = true;
}

Device.resume = function( methodName ) {
	if( methods[ methodName ].paused ) {
		methods[ methodName ].iterator.next();
	}
}

module.exports = Device;
