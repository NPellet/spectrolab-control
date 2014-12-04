

var keithley = require( "../../../controllers/keithley-smu/default/controller" ),
	stream = require( "../../../server/stream" ),
	config = require( "../../../server/config" ),
	renderer = require( "./renderer" );

var ITXBuilder = require("../../../server/databuilder/itx").ITXBuilder,
	Waveform = require("../../../server/waveform"),
	fileSaver = require("../../../server/filesaver");
	
var keithley = new keithley( config.instruments.keithley );
var module = renderer.getModuleByName;


renderer
	.getModule( "smuconnect" )
	.assignKeithley( keithley )
	.on('connected', function() {
		module( "measureparams" ).unlock( 'smu.connection' ); // Unlock voc stab module
	})
	.on('disconnected', function() {
		module( 'measureparams' ).lock( 'smu.connection' ); // Unlock voc stab module	
	});


renderer
	.getModule( "keithleyVocStab" )
	.assignKeithley( keithley )
	.on( "measurementEnd", function( data ) {

		var info = renderer.getModuleByName("sampleInfo").getSampleInfo();
		var parameters = renderer.getModule("measureparams").getMeasurementParams();

		renderer.getModuleByName("GraphVocVsTime").newSerie( info.fileName, data );
		
		// Create a new waveform, set the parameters
		var w = new Waveform();
		w.setDataFromArray( data, 1 );
		w.setXUnit( "s" );
		w.setYUnit( "V" );
		w.setXScalingDelta( 0, parameters.settlingTime );


		var itx = new ITXBuilder();
		var itxw = itx.newWave( "detectorVoltage" );
		itxw.setWaveform( w );



		fileSaver.save( {
			contents: itx.getFile(),
			fileName: info.fileName,
			fileExtension: 'itx',
			dir: './'
		} );
		//renderer.getModuleByName( "IV" ).setIV( iv );
	})
	.lock();

renderer.render();



stream.onClientConnection( function() {
	renderer.getModuleByName("GraphVocVsTime").setXAxisLabel("Time (s)").setYAxisLabel( "Voltage (V)").setHeight( 300 );
})



/*
renderer
	.getModuleByName( "keithleySourceV" )
	.assignKeithley( keithley );
*/