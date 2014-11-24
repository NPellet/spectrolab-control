

var keithley = require( "../../../keithley/controller" ),
	stream = require( "../../../stream" ),
	config = require( "../../../config" ),
	renderer = require( "./renderer" );

var igorSaver = require("../../../igorsaver");
var keithley = new keithley( config.instruments.keithley );

renderer
	.getModuleByName( "keithleyConnect" )
	.assignKeithley( keithley )
	.on('connected', function() {
		renderer.getModuleByName( "keithleyVocStab" ).unlock(); // Unlock voc stab module
	});


renderer
	.getModuleByName( "keithleyVocStab" )
	.assignKeithley( keithley )
	.on( "measurementEnd", function( data ) {

		renderer.getModuleByName("GraphVocVsTime").newSerie( "voc_time", data );
		var info = renderer.getModuleByName("sampleInfo").getSampleInfo();

		var ig = new igorSaver();
		ig.addWaveFromArray( data, 1, "detectorVoltage", 0, 0.1, "s", "V");
		ig.saveTo( info.fileName );
		//renderer.getModuleByName( "IV" ).setIV( iv );
	})
	.lock();

renderer.render();



stream.onClientConnection( function() {
	renderer.getModuleByName("GraphVocVsTime").setXAxisLabel("Time (s)").setYAxisLabel( "Voltage (V)");
})



/*
renderer
	.getModuleByName( "keithleySourceV" )
	.assignKeithley( keithley );
*/