

var experiments = [];
var experimentLoader = {};
var currentExperiment;

experimentLoader.load = function( experimentName ) {

	var experiment = require( __dirname + "/experiments/" + experimentName );
	experiment = new experiment();
	experiment.makeLoop();
	experiment.setId( experiments.length );
	experiments.push( experiment );
	return experiment;
}

experimentLoader.getProcedures = function() {
	return experiments;
}

experimentLoader.runAll = function() {

	function *runner() {

		var i = 0;
		for( var i = 0; i < experiments.length; i ++ ) {

			currentExperiment = experiments[ i ];

			experiments[ i ].run();
			experiments[ i ].on("terminated", function() {
				running.next();
			});
			yield;
		}
	}

	var running = runner();
	running.next();
}


experimentLoader.pause = function() {
	return currentExperiment.pause();
}

experimentLoader.experimentLoopNext = function() {
	if( currentExperiment ) {
		console.log('here2');
		currentExperiment.loopNext();
	}
}



module.exports = experimentLoader;
