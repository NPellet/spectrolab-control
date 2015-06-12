

var fs = require('fs');
var experiment = require('app/experiment');
var Waveform = require('../../server/waveform');
var itx = experiment.itx();
var extend = require("extend");

experiment.loadInstruments();

experiment.renderer = require('./renderer');
experiment.config = require('./config');
experiment.renderer.experiment = experiment;
experiment.renderer.init();
experiment.addInstrumentConnectModules();
var VocDecay = experiment.loadProcedure('VocDecay');

var itx = experiment.itx();

VocDecay.on("progress", function( progress ) {


	switch( progress.type ) {

		case 'vocdecay':

			var vocDecayWave = progress.arguments.vocDecays;
			var i = 1;


			if( vocDecayWave.length == 0 ) {
				var itxw = itx.newWave("times");
				itxw.setWaveform( vocDecayWave[ 0 ].getXWave() );
			}

			var itxw = itx.newWave( "vocdecay_" + progress.arguments.lightIntensity  );
			itxw.setWaveform( vocDecayWave[ vocDecayWave.length - 1 ] );

			experiment.getModule('VocDecay').newSerie("vocvstime_" + progress.arguments.lightIntensity, vocDecayWave[ vocDecayWave.length - 1 ], { lineStyle: i } );
			
			experiment.getModule('VocDecay').autoscale();
			experiment.getModule('VocDecay').redraw();


			var fileName = experiment.getFileSaver().save( {
				contents: itx.getFile(),
				forceFileName: experiment.getDeviceName() + ".itx",
				fileExtension: 'itx',
				dir: './vocdecay/'
			} );

		break;
	}
});


experiment.renderer.render();
