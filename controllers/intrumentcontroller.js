

var events = require("events");


var InstrumentController = new events.EventEmitter;

InstrumentController.log = function( message ) {

	if( this._logger ) {
		this._logger.log( message );
	}
}

InstrumentController.logError = function( message ) {

	if( this._logger ) {
		this._logger.error( message );
	}
}

InstrumentController.logWarning = function( message ) {

	if( this._logger ) {
		this._logger.warning( message );
	}
}

InstrumentController.setLogger = function( logger ) {
	this._logger = logger;
}

module.exports = InstrumentController;
