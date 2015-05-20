

var events = require("events");


var InstrumentController = function() {};

InstrumentController.prototype = new events.EventEmitter;

InstrumentController.prototype.log = function( message ) {

	if( this._logger ) {
		this._logger.log( message );
	}
}

InstrumentController.prototype.logError = function( message ) {

	if( this._logger ) {
		this._logger.error( message );
	}
}

InstrumentController.prototype.logWarning = function( message ) {

	if( this._logger ) {
		this._logger.warning( message );
	}
}

InstrumentController.prototype.setLogger = function( logger ) {
	this._logger = logger;
}

module.exports = InstrumentController;
