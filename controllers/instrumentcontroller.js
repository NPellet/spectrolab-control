

var events = require("events");
var logger = require("../app/logger");
var util = require("util");

var InstrumentController = function() {};

util.inherits( InstrumentController, events.EventEmitter );

InstrumentController.prototype.init = function( config ) {
	makeReadyPromise( this );
	this.config = config;
}

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

InstrumentController.prototype.getConfig = function( ) {
	return this.config;
};


InstrumentController.prototype.command = function( command, priority ) {

	var instrument = this;

	makeReadyPromise( instrument );

	this._queue = this._queue || {};
	this._queue[ priority ] = this._queue[ priority ] || [];
	
	return new Promise( function( resolver, rejecter ) {

		instrument._queue[ priority ].push( { 
			command: command, 
			resolver: resolver, 
			rejecter: rejecter 
		} );

		checkQueue( instrument );

	} );

}


function checkQueue( instrument ) {

	var q;

	if( instrument._processingQueue ) { // Calls are already in progress
		return;
	}	

	instrument._queue = instrument._queue || {};

	var processesInQueue = 0;

	for( q in instrument._queue ) {
		processesInQueue += instrument._queue[ q ].length;
	}
	
	if( processesInQueue > 0 ) {

		makeReadyPromise( instrument );
		processQueue( instrument );
	} else {
		instrument._processingQueue = false;

		// Queue is empty. Everything has been processed
		if ( instrument._readyresolver ) {

			instrument._readyresolver();
		}
	}
}


function processQueue( instrument ) {
	
	var processesInQueue = 0;

	for( var q in instrument._queue ) {
		processesInQueue += instrument._queue[ q ].length;
	}
	
	if( processesInQueue == 0 ) {

		instrument._processingQueue = false;
		instrument._readyresolver();
		return;
	}

	instrument._processingQueue = true;

	instrument.connect().then( function( ) {

		// Selecting priority
		var priorities = Object.keys( instrument._queue ),
			i = 0;
		priorities.sort();

		while( instrument._queue[ priorities[ i ] ].length == 0 ) {
			i++;

			if( i == priorities.length ) {
				return "No more queue. Should not happen";
			}
		}

		var queueElement = instrument._queue[ priorities[ i ] ].shift();


		instrument._currentQueue = queueElement;

		instrument.query( queueElement.command, queueElement ).then( function( response ) {

			instrument._currentQueue.resolver( response );
			processQueue( instrument );

		}, function( data ) {

			if( ! data.nolog ) {
				instrument.logError("Query error for instrument " + instrument.getName() + ". Query was: " + queueElement.command );	
			}
			
			instrument._currentQueue.rejecter();

			if( data.continueprocess ) {
				processQueue( instrument );
			}
		});

	});
}

function makeReadyPromise( instrument ) {

	if( instrument.ready ) {
		return;
	}

	instrument.ready = new Promise( function( resolver, rejecter ) {
		
		instrument._readyresolver = resolver;
		instrument._readyrejecter = rejecter;
	});

}

module.exports = InstrumentController;
