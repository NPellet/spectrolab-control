

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();
experiment.addInstrumentConnectModules();

experiment.renderer.render();

var scope = experiment.getInstruments()['tektronix-oscilloscope'].instrument;

scope.on("connected", function() {

	this.setAcquisitionMode( "SAMPLE" );
	this.setRecordLength( 1000 );

	this.setHorizontalScale( 2e-6 ); // 2 us / div
	this.stopAfterSequence( false );
	this.startAquisition();

	console.log( "smth" );

	update();
})

function update() {

	scope.getChannel( 1 ).then( function( ch ) {

		experiment.renderer.getModule("oscilloscope").newSerie( "rt", ch );
		experiment.renderer.getModule("oscilloscope").autoscale();

		setTimeout( function() {

			update();

		}, 2000 );
	} );
}
