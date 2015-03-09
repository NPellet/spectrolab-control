

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();
experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('imvs');
var Waveform = require('../../server/waveform');
var opt = require('scipy-optimize');

var ivs = [];

proc.on("progress", function( mode, args ) {

	switch( mode ) {

				case "IV_Before":

						experiment.renderer.getModule("IV").newSerie("iv_before", args[ 0 ], { lineColor: 'red' } );
						experiment.renderer.getModule("IV").autoscale();

						var itx = experiment.getITXBuilder();
						itx = new itx();

						var itxw = itx.newWave( "iv_before" );
						itxw.setWaveform( args[ 0 ] );

						var fileName = experiment.getFileSaver().save( {
							contents: itx.getFile(),
							forceFileName: experiment.getDeviceName() + "_IV_Before",
							fileExtension: 'itx',
							dir: './imps/'
						} );

				break;



			case "IV_After":

					experiment.renderer.getModule("IV").newSerie("iv_after", args[ 0 ], { lineColor: 'red' } );
					experiment.renderer.getModule("IV").autoscale();

					var itx = experiment.getITXBuilder();
					itx = new itx();

					var itxw = itx.newWave( "iv_after" );
					itxw.setWaveform( args[ 0 ] );

					var fileName = experiment.getFileSaver().save( {
						contents: itx.getFile(),
						forceFileName: experiment.getDeviceName() + "_IV_After",
						fileExtension: 'itx',
						dir: './imps/'
					} );

			break;

		case "IMPSIMVSData":

				var frequency = args[ 0 ];
				var drive = args[ 1 ];
				var response = args[ 2 ];

				var itx = experiment.getITXBuilder();
				itx = new itx();

				var itxw = itx.newWave( "drive" );
				itxw.setWaveform( drive );

				var itxw = itx.newWave( "response" );
				itxw.setWaveform( response );


				var fileName = experiment.getFileSaver().save( {
					contents: itx.getFile(),
					fileName: experiment.getDeviceName() + "_" + args[ 3 ] + "_" + frequency + "Hz",
					fileExtension: 'itx',
					dir: './imps/'
				} );


				opt.fitCurve(function( x, p1, p2, p3, p4 ) {

					return p1 * Math.sin( p2 * x + p3 ) + p4;

				}, drive.getXWave().getData(), drive.getData(), {}, [0.3, frequency, 1, drive.getAverageP(0, 499) ], function() {

					console.log( arguments );

				} );



				experiment.renderer.getModule("drive").newSerie("drive", drive, { lineColor: 'blue' } );
				experiment.renderer.getModule("response").newSerie( "response", response, { lineColor: 'red' } );
				experiment.renderer.getModule("drive").autoscale();
				experiment.renderer.getModule("response").autoscale();


		break;
	}
//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});

experiment.renderer.render();
