
var experiment = require('app/experiment');
var itx = experiment.itx();

experiment.loadInstruments();
var keithley = experiment.getInstrument("keithley");
var startTime = Date.now();

function start() {

	keithley.measureVs( { channel: 'smub', level: 50e-9, rangei: 100e-9, time: 200 }).then( function( w ) {

		var itxw = itx.newWave( "iv_" + ( Date.now() - startTime ) / 1000  );
		itxw.setWaveform( w );

		var fileName = experiment.getFileSaver().save( {
			contents: itx.getFile(),
			forceFileName: experiment.getDeviceName() + ".itx",
			fileExtension: 'itx',
			dir: './DCpol/'
		} );

		setTimeout( start,800 * 1000);


	} );
}

keithley.connect().then( function() {

	setTimeout( start, 10 * 1000 );
} );
