
var Promise = require("bluebird");

module.exports = function( config, app ) {

	return new Promise( function( resolver, rejecter ) {

		app.getLogger().log( "Starting experiment");
		setTimeout( function() {
			app.getLogger().log( "Experiment ended");
			resolver();
		}, 5000 );
	} );

}
