

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();

experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('eDecayCapacitance');

var Waveform = require('../../server/waveform');

var iv;

proc.on("progress", function( method, args ) {

	if( method == 'iv' ) {

		iv = args[ 0 ];
		experiment.renderer.getModule("IV").newSerie("iv", iv ).autoscale();

	} else {

		var recordedWaves = args[ 0 ];
		var pulseNb = args[ 1 ];
		var lightLevel = args[ 2 ];
		var lastPulseDelay = args[ 3 ];
		var allDelays = args[ 4 ];
		var charges = args[ 5 ];
		var voc = args[ 6 ];
		var delays = args[ 7 ];


		experiment.renderer.getModule("lastJDecay").clear();

		experiment.renderer.getModule("lastJDecay").newSerie("jdecay", recordedWaves[ "2" ].degrade( 1000 ), { lineColor: "#CC0000" } );
		experiment.renderer.getModule("lastVDecay").newSerie("vdecay", recordedWaves[ "3" ].degrade( 1000 ), { lineColor: "#009933" } );

		experiment.renderer.getModule("lastJDecay").autoscale();
		experiment.renderer.getModule("lastVDecay").autoscale();

		reprocess( charges, voc, delays );
	}
//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});


experiment.renderer.render();


var focusId = false;

var moduleGraphs = [ 'vocvstime', 'chargesvstime', 'chargesvsvoc'];

moduleGraphs.map( function( g ) {

	experiment.renderer.getModule( g ).on("mouseOverPoint", function( serieName, id ) {
		focusId = id;
		experiment.renderer.getModule("focus").setText("Focus on point " + id );
	});
});

experiment.renderer.getModule("focus").on("clicked", function() {

	proc.config( "focus", focusId );

	if( focusId !== false ) {
		focusId = false;
		experiment.renderer.getModule("focus").setText("Stop focus" );
	}

});


function reprocess( chargesGlobal, vocsGlobal, delaysGlobal ) {

	var i = 0;
	var colors = ['#a61111', '#2d2d94', '#479116', '#722f8b', '#a36228'];
	var colors2 = ['#cf6565', '#6565cf', '#a2c48b', '#b58bc4', '#ce9f75'];

	experiment.renderer.getModule("vocvstime").clear();
	experiment.renderer.getModule("chargesvstime").clear();
	experiment.renderer.getModule("chargesvsvoc").clear();


	var itx = experiment.getITXBuilder();
	itx = new itx();

	for( var l = 0; l < vocsGlobal.length; l += 1 ) {

		var style = {
			shape: 'circle',
	        r: 2,
	        fill: colors[ l ],
	        stroke: colors[ l ]
    	};


		var style2 = {
			shape: 'circle',
	        r: 2,
	        fill: colors2[ l ],
	        stroke: colors2[ l ]
    	};

		var vocs = vocsGlobal[ l ];
		var charges = chargesGlobal[ l ];
		var timeDelays = delaysGlobal[ l ];


		var vocvstime = [], chargesvstime = [], chargesvsvoc = new Waveform();

		for( var i = 0; i < vocs.getDataLength(); i ++ ) {

			vocvstime.push( [ timeDelays.get( i ), vocs.get( i ) ] );
			chargesvstime.push( [ timeDelays.get( i ), charges.get( i ) ] );
			chargesvsvoc.push( charges.get( i ), vocs.get( i ) );

		}

	//	chargesvsvoc2 = chargesvsvoc.loess( 0.3 );
	//	var CV = chargesvsvoc2.differentiate();


		experiment.renderer.getModule("vocvstime").newScatterSerie("vocvstime_" + l, vocvstime, { }, false, style );

		experiment.renderer.getModule("chargesvstime").newScatterSerie("chargesvstime_" + l, chargesvstime, { }, false, style );
//		experiment.renderer.getModule("chargesvsvoc").newScatterSerie("chargesvsvoc_smth_" + l, chargesvsvoc2, { }, false, style2 );
		experiment.renderer.getModule("chargesvsvoc").newScatterSerie("chargesvsvoc_" + l, chargesvsvoc, { }, false, style );
	//	experiment.renderer.getModule("CV").newScatterSerie("CV_" + l, CV, { }, false, style );

		experiment.renderer.getModule("vocvstime").autoscale();
		experiment.renderer.getModule("chargesvstime").autoscale();
		experiment.renderer.getModule("chargesvsvoc").autoscale();
		experiment.renderer.getModule("CV").autoscale();


	//	var itxw = itx.newWave( "iv" );
//		itxw.setWaveform( iv );


		var itxw = itx.newWave( "voc_" + l );
		itxw.setWaveform( vocs );


		var itxw = itx.newWave( "charges_" + l );
		itxw.setWaveform( charges );

		var itxw = itx.newWave( "timedelays_" + l );
		itxw.setWaveform( timeDelays );

	//	var itxw = itx.newWave( "capacitance_" + l );
		//itxw.setWaveform( CV );

	}

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: "capa.itx",
		fileExtension: 'itx',
		dir: './capacitance/'
	} );
}
