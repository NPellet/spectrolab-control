
var experiment = require('experiment');

var logger = {};


function pad( val ) {
	return ( val + "" ).length == 1 ? '0' + val : val;
}

logger.setIO = function() {


}

logger._log = function( message ) {
	var date = new Date();
	message.time = pad( date.getHours() ) + ":" + pad( date.getMinutes() ) + ":" + pad( date.getSeconds() ); 
	experiment.globalOut("logger", message )

}

logger.log = function( message ) {
	logger._log( {
		type: "log",
		message: message
	} );
}

logger.error = function( message ) {
	logger._log( {
		type: "error",
		message: message
	} );
}

module.exports = logger;