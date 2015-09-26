

var fs = require('fs');
var experiment = require('app/experiment');
var Waveform = require('../../server/waveform');
var itx = experiment.itx();

experiment.loadInstruments();


var keithley = experiment.getInstrument('keithley');

keithley.measureVs( { channel: 'smub', level: 0.0005, rangei: 0.001, time: 1000 }).then( function( w ) {

	var itxw = itx.newWave( "voltages" );
	itxw.setWaveform( w );

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: experiment.getDeviceName() + ".itx",
		fileExtension: 'itx',
		dir: './voltagesvstime_i/'
	} );
});
