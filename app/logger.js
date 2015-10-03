
var logger = {};
var messages = [];

function pad( val ) {
	return ( val + "" ).length == 1 ? '0' + val : val;
}

logger.setIO = function() {


}

logger._log = function( message ) {

	var app = require('app/app');

	var date = new Date();
	message.time = pad( date.getHours() ) + ":" + pad( date.getMinutes() ) + ":" + pad( date.getSeconds() ); 

	messages.push( message );

	if( messages.length > 100 ) {
		messages.shift();
	}

	app.streamOut("logger", messages );
}

logger.log = function( message ) {
	logger._log( {
		type: "log",
		message: message
	} );
}

logger.info = function( message ) {
	logger._log( {
		type: "info",
		message: message
	} );
}

logger.error = function( message ) {
	console.error( message );
	logger._log( {
		type: "error",
		message: message
	} );
}


logger.ok = function( message ) {
	logger._log( {
		type: "ok",
		message: message
	} );
}

logger.getMessages = function() {

	var app = require('app/app');
	app.streamOut("logger", messages );
}

module.exports = logger;