

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();
experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('perturbationcapacitance-delta');
var Waveform = require('../../server/waveform');


proc.on("progress", function( mode, args ) {

	switch( mode ) {

		case 'Voc-Isc':

			var Voc = [];
			var Jsc = [];
			var PerturbationVoltage = [];

			var i = 0;
			args[ 0 ].getData().map( function( c ) {

				Voc.push( [ args[ 2 ].get( i ), args[ 0 ].get( i ) ] );
				Jsc.push( [ args[ 2 ].get( i ), args[ 1 ].get( i ) ] );
				PerturbationVoltage.push( [ args[ 2 ].get( i ), args[ 3 ].get( i ) ] );
				i++;

			});

			experiment.renderer.getModule("Voc").newScatterSerie("Voc", Voc, { } );
			experiment.renderer.getModule("Voc").autoscale();
			experiment.renderer.getModule("Jsc").newScatterSerie("Jsc", Jsc, { } );
			experiment.renderer.getModule("Jsc").autoscale();
			experiment.renderer.getModule("Perturbation").newScatterSerie("Perturbation", PerturbationVoltage, { } );
			experiment.renderer.getModule("Perturbation").autoscale();


		break;

		case "CV":

			var waveVoc = args[ 0 ];
			var wavedC = args[ 3 ];

			var CV = [];
			var i = 0;
			waveVoc.getData().map( function( c ) {
				CV.push( [ waveVoc.get( i ), wavedC.get( i ) ] );
				i++;
			});

			experiment.renderer.getModule("CV").newScatterSerie("CV", CV, { } );
			experiment.renderer.getModule("CV").autoscale();
		break;

		case "current":
			console.log( args );
			experiment.renderer.getModule("JDecay").newSerie("j", args[ 0 ] );
			experiment.renderer.getModule("JDecay").autoscale();

		break;
	}/*
	waveVoc, wavedV, wavedQ, wavedC
*/
//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});


experiment.renderer.render();
