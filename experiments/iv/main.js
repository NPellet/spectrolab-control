

var fs = require('fs');
var experiment = require('app/experiment');
var Waveform = require('../../server/waveform');
var itx = experiment.itx();

experiment.loadInstruments();

var cfgHtml = require("./cfgform.js");

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.renderer.init();




experiment.addInstrumentConnectModules();

var IV = experiment.loadProcedure('iv');
var arduino = experiment.getInstrument('arduino');
var viewLightLevel;
var ivs = {};

experiment.renderer.getModule("ivsetup").setFormHtml( cfgHtml );

experiment.onLoadConfig( function() {
	IV.loadConfig( experiment.config.iv );
	experiment.getModule("ivsetup").setFormData( experiment.config.iv );
	redoIvViewForm( experiment.config.iv.lightLevels );
} );


experiment.getModule("ivview").on("formChanged", function( cfg ) {
	viewLightLevel = parseFloat( cfg.form.lightlevel );
	redoIv();
});

experiment.getModule("ivsetup").on("formChanged", function( cfg ) {

	// Form treatment
	cfg.form.lightLevels = cfg.form.lightLevels.map( function( i ) { return parseInt( i ); } );
	cfg.form.scanRates = cfg.form.scanRates.map( function( i ) { return parseFloat( i ); } );
	cfg.form.vstart = parseFloat( cfg.form.vstart );
	cfg.form.vend = parseFloat( cfg.form.vend );

	// Set it to config
	experiment.config.iv = cfg.form;

	// Upload to experiment
	IV.loadConfig( experiment.config.iv );

	// Redo the form
	redoIvViewForm( cfg.form.lightLevels );
} );

// create a new file
var itx = experiment.itx();

IV.on("progress", function( progress ) {

	var itxw = itx.newWave( "iv_" + progress.arguments.lightLevel + "_" + progress.arguments.scanRate + "_" + progress.arguments.endvoltage );
	itxw.setWaveform( progress.arguments.iv.getIV( ) );



	ivs[ progress.arguments.lightLevel ] = ivs[ progress.arguments.lightLevel ] || [];
	ivs[ progress.arguments.lightLevel ].push( progress.arguments.iv );

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: experiment.getDeviceName() + ".itx",
		fileExtension: 'itx',
		dir: './iv/'
	} );

	redoIv( progress.arguments.lightLevel );
} );


function redoIv( lightLevel ) {

	if( viewLightLevel == lightLevel || lightLevel === undefined ) {

		experiment.getModule( "IV" ).clear();

		if( ivs[ viewLightLevel ] ) {

			for( var i = 0, l = ivs[ viewLightLevel ].length; i < l ; i ++ ) {

				experiment.getModule( "IV" ).setIV( i, ivs[ viewLightLevel ][ i ] );
			}
		}
	}
}

function redoIvViewForm( lightLevels ) {

	viewLightLevel = parseFloat( lightLevels[ 0 ] );
	if( typeof lightLevels !== "undefined" ) {
		var html = '<div class="form-group"><label>Light level to visualize</label>';
		for( var i = 0; i < lightLevels.length; i ++ ) {
			html += '<div class="radio"><label><input type="radio" ' + ( i == 0 ? 'checked="checked"' : '' ) + ' name="lightlevel" value="' + lightLevels[ i ] + '">' + /*arduino.getSunLevel( lightLevels[ i ] )*/0 + ' sun</label></div>';
		}
		html += '</div>';
	} else {
		html = "";
	}
	experiment.getModule('ivview').setFormHtml( html );
}


experiment.renderer.render();
