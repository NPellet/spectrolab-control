

var fs = require('fs');
var experiment = require('app/experiment');
var Waveform = require('../../../server/waveform');
var itx = experiment.itx();
var extend = require("extend");

experiment.loadInstruments();

var cfgHtml = require("./cfgform.js");

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;

experiment.renderer.init();
experiment.addInstrumentConnectModules();

experiment.loadProcedure('qextraction_jsc');
experiment.loadProcedure('qextraction_jsc');
experiment.loadProcedure('qextraction_jsc');
experiment.loadProcedure('qextraction_jsc');
experiment.loadProcedure('qextraction_jsc');

var ivs = {};

experiment.renderer.getModule("config").setFormHtml( cfgHtml );

experiment.onLoadConfig( function() {
	experiment.getModule("config").setFormData( experiment.config );
} );


experiment.getModule("config").on("formChanged", function( cfg ) {
console.log( cfg.form );
console.log('__');
	cfg.form.vscale = parseFloat( cfg.form.vscale );
	cfg.form.lightLevels = [ parseInt( cfg.form.lightLevels ) ];

	// Set it to config
	experiment.config = cfg.form;

	// Upload to experiment
	var pulse = 2;
	experiment.getProcedures().map( function( proc ) {
		proc.loadConfig( experiment.config, function( cfg ) { cfg.timebase /= 1000000; cfg.pulsetime = pulse } );
		pulse /= 5;
	} );
} );

var itx = experiment.itx();


experiment.getProcedures().map( function( proc ) {

	proc.on("progress", function( progress ) {

		switch( progress.type ) {

			case 'charge':

				for( var i = 0; i < progress.arguments.lightLevels.length; i ++ ) {
					var itxw = itx.newWave( "current_" + proc.getId( ) );
					itxw.setWaveform( progress.arguments.currentWaves[ i ] );
				}

				experiment.renderer.getModule( "lastqextr" ).newSerie( "qextr", progress.arguments.lastCurrentWave );


				var fileName = experiment.getFileSaver().save( {
					contents: itx.getFile(),
					forceFileName: experiment.getDeviceName() + ".itx",
					fileExtension: 'itx',
					dir: './chargeextraction_jsc/'
				} );


			break;
		}

	} );


} );


experiment.renderer.render();
