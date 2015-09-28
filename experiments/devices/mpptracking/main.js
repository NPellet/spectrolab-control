

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




var keithley = experiment.getInstrument('keithley-smu');

	keithley.on('connected', function() {
	keithley.MPPTracking( { channel: 'smub' } ).then( function( data ) {

		experiment.getModule("ivst").newSerie("currentStab", data.IvsT );
		experiment.getModule("vvst").newSerie("currentStab", data.VvsT );
		experiment.getModule("ivsv").newSerie("currentStab", data.IvsV );
		experiment.getModule("pvst").newSerie("currentStab", data.PvsT );
	});
//	keithley.getErrors();
});

experiment.renderer.render();
