

var renderer = require( "./renderer" );
var stream = require( "../../server/stream" );

var config = require( "../../server/config" );
var keithley = require( "../../controllers/keithley-smu/default/controller" );
var keithley = new keithley( config.instruments.keithley );
var ITXBuilder = require("../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../server/filesaver");
var Waveform = require("../../server/waveform");

var status = renderer.getModule('status');
var module = renderer.getModuleByName;


renderer
	.getModule( "smuconnect" )
	.assignKeithley( keithley )
	.assignStatus( status );
	


renderer
	.getModule( "iv" )
	.assignKeithley( keithley )

renderer
	.getModuleByName( "iv" )
	.on("measuring", function() {

		status.update("Measuring...", "process");
	})
	.on("sweepDone", function( w ) {

		status.update("Measurement done", "ok");
		
		renderer.getModuleByName("GraphVocVsTime").newSerie( "iv", w );

		var wa = new Waveform();
		wa.setData( w.map( function( val ) { return val[ 0 ]; }) );

		var wb = new Waveform();
		wb.setData( w.map( function( val ) { return val[ 1 ]; }) );

		// Create a new waveform, set the parameters
		var itx = new ITXBuilder();
		var itxw = itx.newWave( "voltage" );
		itxw.setWaveform( wa );

		var itxw = itx.newWave( "current" );
		itxw.setWaveform( wb );

		
		var fileName = fileSaver.save( {
			contents: itx.getFile(),
			fileName: "iv",
			fileExtension: 'itx',
			dir: './'
		} );

	});


renderer.assign("GraphVocVsTime", "legend", "legend")




renderer.render();


stream.onClientReady( function() {


});
