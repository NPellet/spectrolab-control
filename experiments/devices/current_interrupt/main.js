

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

experiment.renderer.getModule( "config" ).setFormHtml( cfgHtml );

experiment.onLoadConfig( function() {
	CurrentInterupt.loadConfig( experiment.config, function( cfg ) { cfg.timebase /= 1000000; } );
	experiment.getModule("config").setFormData( experiment.config );
} );


experiment.getModule( "config" ).on( "formChanged", function( cfg ) {
	// Set it to config
	experiment.config = cfg.form;
	// Upload to experiment
	CurrentInterupt.loadConfig( experiment.config, function( cfg ) { cfg.timebase /= 1000000; } );
} );



var itx = experiment.itx();
var vocjsc = new Waveform();

var lightLevels = itx.newWave( "lightLevels" );
var jscs = itx.newWave( "jscs" );

CurrentInterupt.on("progress", function( progress ) {

	switch( progress.type ) {

		case 'charge':

			lightLevels.setWaveform( progress.arguments.lightLevels );

			var vocjsc = new Waveform();

			for( var i = 0; i < progress.arguments.lightLevels.length; i ++ ) {
				vocjsc.push( progress.arguments.jscs[ i ] || 0, progress.arguments.voltages[ i ] );
			}

			var itxw = itx.newWave( "voltage_" + progress.arguments.lastLightLevel );
			itxw.setWaveform( progress.arguments.lastVoltageWave );


			experiment.renderer.getModule( "graph" ).newScatterSerie( "vocjsc", vocjsc );
			experiment.renderer.getModule( "lastvoltage" ).newSerie( "lastvoltage", progress.arguments.lastVoltageWave );


		break;

		case 'jscs':

console.log( progress.arguments.jscs );
			jscs.setWaveform( progress.arguments.jscs );

			var vocjsc = new Waveform();
			for( var i = 0; i < progress.arguments.lightLevels.length; i ++ ) {
				vocjsc.push( progress.arguments.jscs[ i ] || 0, progress.arguments.voltages[ i ] );
			}

			experiment.renderer.getModule( "graph" ).newScatterSerie( "vocjsc", vocjsc );


		break;
	
	}

	try {
		var fileName = experiment.getFileSaver().save( {
			contents: itx.getFile(),
			forceFileName: experiment.getDeviceName() + ".itx",
			fileExtension: 'itx',
			dir: './current_interrupt/'
		} );
	} catch( e ) {
		// Nothing to do, that's normal
	}

} );

experiment.renderer.render();
