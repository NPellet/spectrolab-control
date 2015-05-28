

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

var CurrentInterupt = experiment.loadProcedure('current_interrupt');
var ivs = {};

experiment.renderer.getModule("config").setFormHtml( cfgHtml );

experiment.onLoadConfig( function() {
	CurrentInterupt.loadConfig( experiment.config, function( cfg ) { cfg.timebase /= 1000000; } );
	experiment.getModule("config").setFormData( experiment.config );
} );


experiment.getModule("config").on("formChanged", function( cfg ) {
	// Set it to config
	experiment.config = cfg.form;
	// Upload to experiment
	CurrentInterupt.loadConfig( experiment.config, function( cfg ) { cfg.timebase /= 1000000; } );
} );


CurrentInterupt.on("progress", function( progress ) {

	switch( progress.type ) {

		case 'charge':

			var itx = experiment.itx();
			var vocjsc = new Waveform();

			var itxw = itx.newWave( "lightLevels" );
			itxw.setWaveform( progress.arguments.lightLevels );


			var itxw = itx.newWave( "jscs" );
			itxw.setWaveform( progress.arguments.jscs );

			for( var i = 0; i < progress.arguments.lightLevels.length; i ++ ) {
				vocjsc.push( progress.arguments.voltages[ i ], progress.arguments.jscs[ i ] );

				var itxw = itx.newWave( "voltage_" + i );
				itxw.setWaveform( progress.arguments.voltageWaves[ i ] );
			}

			experiment.renderer.getModule( "graph" ).newScatterSerie( "vocjsc", vocjsc );
			experiment.renderer.getModule( "lastvoltage" ).newSerie( "lastvoltage", progress.arguments.lastVoltageWave );

			var fileName = experiment.getFileSaver().save( {
				contents: itx.getFile(),
				forceFileName: experiment.getDeviceName() + ".itx",
				fileExtension: 'itx',
				dir: './current_interrupt/'
			} );

		break;
	}

} );

experiment.renderer.render();
