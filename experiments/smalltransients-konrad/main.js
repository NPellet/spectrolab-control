

var fs = require('fs');
var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();
experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('smalltransients-konrad');
var Waveform = require('../../server/waveform');

var itx = experiment.itx();


var i = 0;

proc.on("progress", function( method, args ) {

	switch( method ) {

		case 'iv':
			i++;
			var iv = args[ 0 ];
console.log( iv );
			experiment.renderer.getModule( "iv" ).setIV( "lastIv_" + i , iv );
			experiment.renderer.getModule( "iv" ).autoscale();

			var itxw = itx.newWave( "iv_backward_" + i );
			itxw.setWaveform( iv.getBackwardScan( ) );

			var itxw = itx.newWave( "iv_forward_" + i );
			itxw.setWaveform( iv.getForwardScan( ) );


		break;

		case 'jscTransient':

			var jscTransient = args[ 0 ];

			experiment.renderer.getModule( "jscTransient" ).newSerie( "jscTransient", jscTransient );
			experiment.renderer.getModule( "jscTransient" ).autoscale();

			var itxw = itx.newWave( "jscTransient" );
			itxw.setWaveform( jscTransient );

		break;
	}

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: experiment.getDeviceName() + ".itx",
		fileExtension: 'itx',
		dir: './konrad/'
	} );

//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});

experiment.renderer.render();
