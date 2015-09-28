

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

var Waveform = require('../../server/waveform');

var itx = experiment.itx();

experiment.renderer.getModule("config").setFormHtml( cfgHtml );
experiment.renderer.getModule("config").setFormData( cfgData );

experiment.renderer.getModule("config").on("submitClicked", function( data ) {

	switch( data.submit.action ) {

		case 'save':

			var wavename = data.form.wavename;

			var waves = experiment.getInstruments()['tektronix-oscilloscope'].instrument.getWaves().then( function( waves ) {

				for( var i = 1; i <= 4; i ++ ) {
					var itxw = itx.newWave( "CH" + i );
					itxw.setWaveform( waves[ i ] );
				}

				var fileName = experiment.getFileSaver().save( {
					contents: itx.getFile(),
					fileName: wavename,
					fileExtension: 'itx',
					dir: './wavesfromscope/'
				} );


			})

		break;
	}

} );



experiment.renderer.render();
