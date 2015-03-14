

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();
experiment.addInstrumentConnectModules();

experiment.renderer.render();


var focusId = false;

var moduleGraphs = [ 'vocvstime', 'chargesvstime', 'C-V', 'C-t' ];

experiment.getInstruments()['tektronix-oscilloscope'].instrument.on("connected", function() {

	console.log( "smth" );

	this.getChannel().then( function( ch ) {

		console.log ( ch );

		experiment.renderer.getModule("oscilloscope").newSerie( "rt", ch );
		experiment.renderer.getModule("oscilloscope").autoScale();
	})
})
