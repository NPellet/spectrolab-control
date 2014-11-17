

var keithley = require( "../../../keithley/controller" ),
	config = require( "../../../config" ),
	renderer = require( "./renderer" );

var keithley = new keithley( config.instruments.keithley );

renderer
	.getModuleByName( "keithleyConnect" )
	.assignKeithley( keithley )
	.on('connected', function() {
		renderer.getModuleByName( "keithleySweep" ).unlock();
	});
/*
renderer
	.getModuleByName( "keithleySourceV" )
	.assignKeithley( keithley );
*/
renderer
	.getModuleByName( "keithleySweep" )
	.assignKeithley( keithley )
	.onSweepEnd( function( iv ) {

		renderer.getModuleByName( "IV" ).setIV( iv );
		
	})
	.lock();


renderer.render();