

var fs = require('fs');
var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();
experiment.renderer.init();
experiment.addInstrumentConnectModules();

var TPCTPV = experiment.loadProcedure('TPCTPV');
var Waveform = require('../../server/waveform');

var itx = experiment.itx();


var mainConfig;

experiment.onLoadConfig( function() {
	TPCTPV.loadConfig( experiment.config, function( cfg ) { cfg.timebase /= 1000000; } );
} );


TPCTPV.on("progress", function( results ) {
console.log( results );
	switch( results.type ) {

		case 'iv':

			var iv = args[ 0 ];
			var voc = args[ 1 ];
			var jsc = args[ 2 ];
			var dc = args[ 3 ];

			experiment.renderer.getModule( "iv" ).setIV( "lastIv_" + dc, iv );
			experiment.renderer.getModule( "iv" ).autoscale();

			var itxw = itx.newWave( "iv_" + dc + "_backward" );
			itxw.setWaveform( iv.getBackwardScan( ) );

			var itxw = itx.newWave( "iv_" + dc + "_forward" );
			itxw.setWaveform( iv.getForwardScan( ) );


		break;

		case 'TPV':

			var vocDecay = results.arguments.TPV;
			var dc = results.arguments.Sun;

			experiment.renderer.getModule( "vocDecay" ).newSerie( "lastVocDecay_" + dc, vocDecay );
	//		experiment.renderer.getModule( "jscDecay" ).newSerie( "lastJscDecay", jscDecay );

			experiment.renderer.getModule( "vocDecay" ).autoscale();
	//		experiment.renderer.getModule( "jscDecay" ).autoscale();
			var itxw = itx.newWave( "TPV_" + dc );
			itxw.setWaveform( vocDecay );

//			var itxw = itx.newWave( "jscdecay_" + dc );
//			itxw.setWaveform( jscDecay );

		break;

		case 'TPC':
			var jscDecay = results.arguments.TPC;
			var dc = results.arguments.Sun;
			experiment.renderer.getModule( "jscDecay" ).newSerie( "lastJscDecay_" + dc, jscDecay );
			experiment.renderer.getModule( "jscDecay" ).autoscale();
			var itxw = itx.newWave( "TPC_" + dc );
			itxw.setWaveform( jscDecay );
		break;
	}

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: experiment.getDeviceName() + ".itx",
		fileExtension: 'itx',
		dir: './TPCTPV/'
	} );

//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});

experiment.renderer.render();
