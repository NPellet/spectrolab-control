

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

	this.setMeasurementType( 1, "PHASE" );
	this.setMeasurementSource( 1, 2 );
	this.setMeasurementReference( 1, 1 );
	this.enableMeasurement( 1 );

	update();
})

function update() {

	this.setMeasurementType( 1, "PHASE" );
	this.setMeasurementSource( 1, 2 );
	this.setMeasurementReference( 1, 1 );
	this.enableMeasurement( 1 );


	scope.getMeasurementUntilStdDev( 1, 0.15, 10, 1 ).then( function( val ) {
		console.log( val.mean );
		console.log( val.stdDev );
		console.log( "Time : " + val.time + " ms" );
		console.log( "Iterations : " + val.nbIterations );
	})

}
