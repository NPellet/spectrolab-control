

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

var itx = experiment.itx();

proc.on("progress", function( method, args ) {


	var itxw = itx.newWave( "iv_" + args[ 1 ] + "_backward" );
	itxw.setWaveform( args[ 0 ].getBackwardScan( ) );

	var itxw = itx.newWave( "iv_" + args[ 1 ] + "_forward" );
	itxw.setWaveform( args[ 0 ].getForwardScan( ) );

	switch( method ) {

		case 'iv':
			experiment.renderer.getModule( "IV" ).setIV( "light_" + args[ 1 ], args[ 0 ] );
		break;
	}


	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: experiment.getDeviceName() + ".itx",
		fileExtension: 'itx',
		dir: './iv/'
	} );

} );

experiment.renderer.render();
