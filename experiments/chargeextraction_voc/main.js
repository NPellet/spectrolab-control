

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('chargeextraction_voc');
var Waveform = require('../../server/waveform');

proc.on("progress", function( method, results ) {

	switch( method ) {

		case 'charges':

			var qvoc = new Waveform();
			for( var i = 0; i < results.lightLevels.length; i ++ ) {
				qvoc.push( results.charges[ i ], results.vocs[ i ] );
			}

			experiment.renderer.getModule( "graph" ).newScatterSerie( "qvoc", qvoc );
		break;
	}

} );

experiment.renderer.render();
