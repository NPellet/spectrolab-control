

var fs = require('fs');
var experiment = require('app/experiment');
var cfgHtml = require("./cfgform.js");
var cfgData = require("./cfgdata.js");

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();
experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.loadProcedure('TPCTPV');
var Waveform = require('../../server/waveform');

var itx = experiment.itx();

experiment.renderer.getModule("config").setFormHtml( cfgHtml );
experiment.renderer.getModule("config").setFormData( cfgData );

var mainConfig;

experiment.onLoadConfig( function() {
	experiment.getModule("pulse").setConfig( experiment.config.pulse );
} );


proc.loadConfig( cfgData.config );

experiment.getModule("pulse").on("configChanged", function( cfg ) {

	experiment.config.pulse = cfg;
});


experiment.renderer.getModule("config").on("submitClicked", function( data ) {

	proc.config( "setConfig", [ data.form.config ] );

	var cfg = data.form.config;
	data.form.config = {};
	for( var i = 0; i < cfg.length; i ++ ) {
		data.form.config[ i ] = cfg[ i ];
	}

	switch( data.submit.action ) {

		case 'testIt':

			switch( data.submit.perturbationtype ) {

				case 'voltage':
					proc.config( "tuneVoltage", [ data.submit.lightintensity ] );
				break;

				case 'current':
					proc.config( "tuneCurrent", [ data.submit.lightintensity ] );
				break;
			}

		break;

		case 'captureFromScope':

			proc.config( "captureFromScope", [ data.submit.lightintensity, data.submit.perturbationtype ] ).then( function() {

				experiment.renderer.getModule("config").setFormData( data.form );

			});

		break;

		case 'save':
			fs.writeFile( __dirname + '/pulsecfg/' + data.form.cfgname + ".json", JSON.stringify( data.form ), function (err) {
			  if (err) throw err;
			  console.log('It\'s saved!');
			});

		break;

		case 'load':

			var val = JSON.parse( fs.readFileSync( __dirname + '/pulsecfg/' + data.form.cfgname + ".json" ) );
			experiment.renderer.getModule("config").setFormData( val );


			proc.config( "setConfig", [ val.config  ] );
		break;
	}

} );


proc.on("progress", function( method, args ) {

	switch( method ) {

		case 'iv':

			var iv = args[ 0 ];
			var voc = args[ 1 ];
			var jsc = args[ 2 ];
			var dc = args[ 3 ];

			experiment.renderer.getModule( "iv" ).setIV( "lastIv_" + dc, iv );
			experiment.renderer.getModule( "iv" ).autoscale();

			var itxw = itx.newWave( "iv_" + dc + "_backward" );
			itxw.setWaveform( iv.getBackwardScan( ) );

			var itxw = itx.newWave( "iv_" + dc + "_forward" );
			itxw.setWaveform( iv.getForwardScan( ) );


		break;

		case 'perturbation':

			var vocDecay = args[ 0 ];
			var jscDecay = args[ 1 ];
			var dc = args[ 2 ];

			experiment.renderer.getModule( "vocDecay" ).newSerie( "lastVocDecay", vocDecay );
			experiment.renderer.getModule( "jscDecay" ).newSerie( "lastJscDecay", jscDecay );

			experiment.renderer.getModule( "vocDecay" ).autoscale();
			experiment.renderer.getModule( "jscDecay" ).autoscale();

			var itxw = itx.newWave( "vocdecay_" + dc );
			itxw.setWaveform( vocDecay );

			var itxw = itx.newWave( "jscdecay_" + dc );
			itxw.setWaveform( jscDecay );

		break;
	}

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: experiment.getDeviceName() + ".itx",
		fileExtension: 'itx',
		dir: './smallpertubation/'
	} );

//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});

experiment.renderer.render();
