

var renderer = require( "./renderer" );
var stream = require( "../../server/stream" );

var config = require( "../../server/config" );
var keithley = require( "../../controllers/keithley-smu/default/controller" );
var keithley = new keithley( config.instruments.keithley );
var ITXBuilder = require("../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../server/filesaver");


var status = renderer.getModule('status');
var module = renderer.getModuleByName;


renderer
	.getModule( "smuconnect" )
	.assignKeithley( keithley )
	.assignStatus( status );
	


renderer
	.getModule( "poling" )
	.assignKeithley( keithley )

renderer
	.getModuleByName( "poling" )
	.on("measuring", function() {

		status.update("Measuring...", "process");
	})
	.on("measurementDone", function( w ) {

		status.update("Measurement done", "ok");
		
//		renderer.getModuleByName("GraphVocVsTime").newSerie( "poling", w );
		
		// Create a new waveform, set the parameters
		var itx = new ITXBuilder();
		var itxw = itx.newWave( "voltage" );
		itxw.setWaveform( w[ 0 ] );

		var itxw = itx.newWave( "current" );
		itxw.setWaveform( w[ 1 ] );

		var d = [];
		var v = w[ 0 ].getData();
		var c = w[ 1 ].getData();

		for( var i = 0; i < v.length; i ++ ) {
			d.push( v[ i ] );
			d.push( c[ i ] );
		}
console.log( d );
		renderer.getModuleByName("GraphVocVsTime").newSerie( "poling", d );


		var fileName = fileSaver.save( {
			contents: itx.getFile(),
			fileName: "poling",
			fileExtension: 'itx',
			dir: './'
		} );
	});


renderer.assign("GraphVocVsTime", "legend", "legend")




renderer.render();


stream.onClientReady( function() {


});
