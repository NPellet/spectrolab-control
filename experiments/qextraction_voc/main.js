

var fs = require('fs');
var experiment = require('app/experiment');
var Waveform = require('../../server/waveform');
var itx = experiment.itx();
var extend = require("extend");

experiment.loadInstruments();

var cfgHtml = require("./cfgform.js");

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;

experiment.renderer.init();
experiment.addInstrumentConnectModules();

var QExtr = experiment.loadProcedure('qextraction_voc');
var ivs = {};

experiment.renderer.getModule("config").setFormHtml( cfgHtml );

experiment.onLoadConfig( function() {
	QExtr.loadConfig( experiment.config, function( cfg ) { cfg.timebase /= 1000000; } );
	console.log( experiment.config );
	console.log('_');
	experiment.getModule("config").setFormData( experiment.config );
} );


experiment.getModule("config").on("formChanged", function( cfg ) {

	cfg.form.vscale = parseFloat( cfg.form.vscale );

	// Set it to config
	experiment.config = cfg.form;

	// Upload to experiment
	QExtr.loadConfig( experiment.config, function( cfg ) { cfg.timebase /= 1000000; } );
} );


QExtr.on("progress", function( progress ) {

	switch( progress.type ) {

		case 'charge':

			var itx = experiment.itx();
			var qvoc = new Waveform();

			var itxw = itx.newWave( "lightLevels" );
			itxw.setWaveform( progress.arguments.lightLevels );

			var itxw = itx.newWave( "charges" );
			itxw.setWaveform( progress.arguments.charges );

			var itxw = itx.newWave( "vocs" );
			itxw.setWaveform( progress.arguments.vocs );

			for( var i = 0; i < progress.arguments.lightLevels.length; i ++ ) {
				qvoc.push( progress.arguments.charges[ i ], progress.arguments.vocs[ i ] );

				var itxw = itx.newWave( "current_" + i );
				itxw.setWaveform( progress.arguments.currentWaves[ i ] );

				var itxw = itx.newWave( "voltage_" + i );
				itxw.setWaveform( progress.arguments.voltageWaves[ i ] );
			}

			experiment.renderer.getModule( "graph" ).newScatterSerie( "qvoc", qvoc );
			experiment.renderer.getModule( "lastqextr" ).newSerie( "qextr", progress.arguments.lastCurrentWave );

			var fileName = experiment.getFileSaver().save( {
				contents: itx.getFile(),
				forceFileName: experiment.getDeviceName() + ".itx",
				fileExtension: 'itx',
				dir: './chargeextraction_voc/'
			} );

		break;
	}

} );

experiment.renderer.render();
