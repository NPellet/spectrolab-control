
var Device = {};
var methods = {};

var EventEmitter = require('events').EventEmitter;

Device = new EventEmitter();

Device.method = function( methodName, methodOptions ) {

	if( methods[ methodName ] ) {
		throw "Cannot add a second method with name " + methodName;
	}

	var experiment = require( "./experiments/" + methodName.toLowerCase( ) );
	experiment.init( methodOptions );

	experiment.progress = function() {
		arguments = Array.prototype.unshift.call( arguments, "progress" );
		Device.emit.apply( Device, arguments ); 
	}

	methods[ methodName ] = experiment;
	return this;
}

Device.run = function( methodName ) {

	if( methods[ methodName ] ) {

		methods[ methodName ].run();	
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