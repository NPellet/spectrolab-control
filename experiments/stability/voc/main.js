

var keithley = require( "../../../controllers/keithley-smu/default/controller" ),
	stream = require( "../../../server/stream" ),
	config = require( "../../../server/config" ),
	renderer = require( "./renderer" );

var ITXBuilder = require("../../../server/databuilder/itx").ITXBuilder,
	Waveform = require("../../../server/waveform"),
	fileSaver = require("../../../server/filesaver");
	
var keithley = new keithley( config.instruments.keithley );
var module = renderer.getModuleByName;

var status = renderer.getModule('status');


renderer
	.getModule( "smuconnect" )
	.assignKeithley( keithley )
	.on("connecting", function() {
		status.update("Connecting to Keithley SMU...", 'process');
	})
	.on('connected', function() {
		status.update("Connected to Keithley SMU", 'ok');
		module( "measureparams" ).unlock( 'smu.connection' ); // Unlock voc stab module
	})
	.on('disconnected', function() {
		status.update("Disconnected from Keithley SMU", 'error');
		module( 'measureparams' ).lock( 'smu.connection' ); // Unlock voc stab module	
	});


renderer
	.getModule( "measurementparams" )
	.assignKeithley( keithley )
	.on( "measuring", function( data ) {
		status.update("Measuring...", "process");
	})
	.on( "measurementEnd", function( data ) {

		var info = renderer.getModuleByName("sampleInfo").getSampleInfo();
		var parameters = renderer.getModule("measurementparams").getMeasurementParams();

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

		var fileName = fileSaver.save( {
			contents: itx.getFile(),
			fileName: info.fileName,
			fileExtension: 'itx',
			dir: './'
		} );

		status.update("Measurement ended. File saved under <em>" + fileName + "</em>", "ok");
	})
	.lock();

renderer.render();



stream.onClientReady( function() {


	renderer.getModuleByName("GraphVocVsTime").setXAxisLabel("Time (s)").setYAxisLabel( "Voltage (V)").setHeight( 300 );
})



/*
renderer
	.getModuleByName( "keithleySourceV" )
	.assignKeithley( keithley );
*/