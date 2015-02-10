
var Device = {};

Device.method = function( methodName, methodOptions ) {

	var experiment = require( "./experiments/" + methodName.toLowerCase( ) );
	experiment = new experiment();
	experiment.init( methodOptions );
	return experiment;
}

module.exports = Device;