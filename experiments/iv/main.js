

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
	experiment.getModule("ivsetup").setFormData( experiment.config.iv );
	redoIvViewForm( experiment.config.iv.lightlevels );
} );


experiment.getModule("ivview").on("formChanged", function( cfg ) {
	viewLightLevel = cfg.form.lightlevel;
	redoIv();
});

experiment.getModule("ivsetup").on("formChanged", function( cfg ) {
	
	experiment.config.iv = cfg.form;

	redoIvViewForm( cfg.form.lightlevels );
} );

// create a new file
var itx = experiment.itx();

IV.on("progress", function( method, progress ) {

	var itxw = itx.newWave( "iv_" + progress.lightLevel + "_" + progress.scanRate + "_backward" );
	itxw.setWaveform( progress.iv.getBackwardScan( ) );

	var itxw = itx.newWave( "iv_" + progress.lightLevel + "_" + progress.scanRate + "_forward" );
	itxw.setWaveform( progress.iv.getForwardScan( ) );

	ivs[ progress.lightLevel ] = ivs[ progress.lightLevel ] || [];
	ivs[ progress.lightLevel ].push( progress.iv );

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: experiment.getDeviceName() + ".itx",
		fileExtension: 'itx',
		dir: './iv/'
	} );

	redoIv( progress.lightLevel );
} );


function redoIv( lightLevel ) {

	if( viewLightLevel == lightLevel || lightLevel === undefined ) {

		if( ivs[ viewLightLevel ] ) {
	
			experiment.getModule( "IV" ).clear();

			for( var i = 0, l = ivs[ viewLightLevel ].length; i < l ; i ++ ) {

				experiment.getModule( "IV" ).setIV( i, ivs[ viewLightLevel ][ i ] );
			}
		}
	}
}

function redoIvViewForm( lightLevels ) {

	if( typeof lightLevels !== "undefined" ) {
		var html = '<div class="form-group"><label>Light level to visualize</label>';
		for( var i = 0; i < lightLevels.length; i ++ ) {
			html += '<div class="radio"><label><input type="radio" name="lightlevel" value="' + i + '">' + arduino.getSunLevel( i ) + ' sun</label></div>';
		}
		html += '</div>';
	} else {
		html = "";
	}
	experiment.getModule('ivview').setFormHtml( html );
}


experiment.renderer.render();
