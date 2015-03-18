

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();

experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('VocDecay');

proc.on("progress", function( response ) {
console.log( response );
	var vocDecayWave = response;
	var i = 1;

	experiment.renderer.getModule('VocDecay').clear();

	vocDecayWave.map( function( wave ) {
		experiment.renderer.getModule('VocDecay').newSerie("vocvstime" + i , wave, { lineStyle: i } );
		i++;
	});

	experiment.renderer.getModule('VocDecay').autoscale();
	experiment.renderer.getModule('VocDecay').redraw();

});


var itx = experiment.getITXBuilder();
var itx = new itx();


proc.on("done", function( response ) {

	var waves = response;

	var i = 0;

	waves.map( function ( w ) {

		var itxw = itx.newWave( "vocdecay_" + i  );
		itxw.setWaveform( w );

		if( i == 0 ) {
			var itxw = itx.newWave("times");
			itxw.setWaveform( w.getXWave() );
		}

		i++;
	});


	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		fileName: "vocdecay.itx",
		fileExtension: 'itx',
		dir: './vocdecay/'
	} );

} );


experiment.renderer.render();
