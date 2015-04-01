

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();

experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('iv');
var Waveform = require('../../server/waveform');
var iv;


proc.on("progress", function( method, args ) {

	switch( method ) {

		case 'iv':
			experiment.renderer.getModule( "IV" ).setIV( "light_" + args[ 1 ], args[ 0 ] );
		break;
	}

} );

experiment.renderer.render();
