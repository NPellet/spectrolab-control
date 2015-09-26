

var experiment = require('app/experiment');
experiment.loadInstruments();

var keithley = experiment.getInstrument('keithley');

keithley.connect().then( function() {
	console.log('Uploading scripts...');
	keithley.uploadScripts();
});
