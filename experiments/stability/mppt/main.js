

var keithley = require( "../../../keithley/controller" ),
	config = require( "../../../config" ),
	renderer = require( "./renderer" );

var fs = require('fs');
var igorSaver = require("../../../itx_maker");

var keithley = new keithley( config.instruments.keithley );

renderer
	.getModuleByName( "keithleyConnect" )
	.assignKeithley( keithley )
	.on('connected', function() {
		renderer.getModuleByName( "keithleySweep" ).unlock();
	});

renderer
	.getModuleByName( "keithleySweep" )
	.assignKeithley( keithley )
	.on( "sweepEnd", function( iv ) {

		//renderer.getModuleByName( "IV" ).setIV( iv );


		var info = renderer.getModuleByName("sampleInfo").getSampleInfo();

		var ig = new igorSaver();
		ig.addWaveFromArray( iv, 0, "voltage", 0, 0.1, "s", "A");
		ig.addWaveFromArray( iv, 1, "current", 0, 0.1, "s", "V");
		ig.saveTo( info.fileName );



	})
	.lock();


renderer.render();



/*
renderer
	.getModuleByName( "keithleySourceV" )
	.assignKeithley( keithley );
*/