

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

VocDecay.on("progress", function( response ) {
	var vocDecayWave = response;
	var i = 1;

	experiment.getModule('VocDecay').clear();
	vocDecayWave.map( function( wave ) {
		experiment.getModule('VocDecay').newSerie("vocvstime" + i , wave, { lineStyle: i } );
		i++;
	});

	experiment.getModule('VocDecay').autoscale();
	experiment.getModule('VocDecay').redraw();

});


VocDecay.on("terminated", function( response ) {

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
