var experimentLoader = {};

experimentLoader.load = function( experimentName ) {
	
	var experiment = require( __dirname + "/experiments/" + experimentName );
	experiment = new experiment();

	experiments.push( experimentName );
}

experimentLoader.runAll = function() {

	function runner*() {

		var i = 0;
		for( var i = 0; i < experiments.length; i ++ ) {

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