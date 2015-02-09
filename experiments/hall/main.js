

var renderer = require( "./renderer" );
var stream = require( "../../server/stream" );

var config = require( "../../server/config" );
var keithley = require( "../../controllers/keithley-smu/default/controller" );
var keithley = new keithley( config.instruments.keithley );



renderer
	.getModule( "smuconnect" )
	.assignKeithley( keithley )

renderer
	.getModule( "hall" )
	.assignKeithley( keithley )

renderer
	.getModuleByName( "hall" )
	.on("measurementDone", function( val ) {

		renderer.getModule('table').addRow( {

			'I_from': val.source_1,
			'I_to': val.source_2,
			'V_from': val.measure_1,
			'V_to': val.measure_2,
			'Voltage': Math.round( val.voltage * 100 ) / 100 + " Ohm"
		} )

	});

renderer.render();


stream.onClientReady( function() {

	renderer
		.getModule("table")
		.addColumn("I_from")
		.addColumn("I_to")
		.addColumn("V_from")
		.addColumn("V_to")
		.addColumn("Voltage")

});
