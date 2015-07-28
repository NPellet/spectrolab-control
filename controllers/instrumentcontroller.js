

var events = require("events");
var logger = require("../server/logger");
var util = require("util");

var InstrumentController = function() {};

util.inherits( InstrumentController, events.EventEmitter );

InstrumentController.prototype.log = function( message ) {
	logger.log( message );
}

InstrumentController.prototype.logError = function( message ) {
	logger.error( message );
}

InstrumentController.prototype.logWarning = function( message ) {
	logger.warning( message );
}

InstrumentController.prototype.logOk = function( message ) {
	logger.ok( message );	
}

InstrumentController.prototype.setName = function( name ) {
	this.name = name;
}

InstrumentController.prototype.getName = function( ) {
	return this.name;
}

module.exports = InstrumentController;
