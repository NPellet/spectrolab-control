

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('chargeextraction_jsc');
var Waveform = require('../../server/waveform');

proc.on("progress", function( method, results ) {

	switch( method ) {

		case 'charges':

			var qjsc = new Waveform();
			for( var i = 0; i < results.lightLevels.length; i ++ ) {
				qjsc.push( results.charges[ i ], results.jscs[ i ] );
			}

			experiment.renderer.getModule( "graph" ).newScatterSerie( "qjsc", qjsc );
		break;
	}

} );

experiment.renderer.render();
