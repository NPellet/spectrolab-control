

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();
experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('smalltransients');
var Waveform = require('../../server/waveform');

var itx = experiment.itx();

proc.on("progress", function( method, args ) {

	switch( method ) {

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

		case 'perturbation':

			var vocDecay = args[ 0 ];
			var jscDecay = args[ 1 ];
			var dc = args[ 2 ];

			experiment.renderer.getModule( "vocDecay" ).newSerie( "lastVocDecay", vocDecay );
			experiment.renderer.getModule( "jscDecay" ).newSerie( "lastJscDecay", jscDecay );

			experiment.renderer.getModule( "vocDecay" ).autoscale();
			experiment.renderer.getModule( "jscDecay" ).autoscale();

			var itxw = itx.newWave( "vocdecay_" + dc );
			itxw.setWaveform( vocDecay );

			var itxw = itx.newWave( "jscdecay_" + dc );
			itxw.setWaveform( jscDecay );

		break;
	}

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: experiment.getDeviceName() + ".itx",
		fileExtension: 'itx',
		dir: './smallpertubation/'
	} );

//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});

experiment.renderer.render();
