

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();

experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('eDecayCapacitance');

var Waveform = require('../../server/waveform');



proc.on("progress", function( recordedWaves, pulseNb, lightLevel, lastPulseDelay, allDelays, charges, voc, capacitances, chargesFastest, capacitanceFastest ) {


	experiment.renderer.getModule("lastJDecay1").newSerie("jdecay1", recordedWaves[ 0 ][ "2"], { } );
	//experiment.renderer.getModule("lastJDecay2").newSerie("jdecay2", recordedWaves[ 1 ][ "2"], { } );

	experiment.renderer.getModule("lastJDecay1").autoscale();
	//experiment.renderer.getModule("lastJDecay2").autoscale();

	reprocess( charges, voc, capacitances, allDelays, chargesFastest, capacitanceFastest );
//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});


experiment.renderer.render();

/*
var focusId = false;

moduleGraphs.map( function( g ) {

	renderer.getModule( g ).on("mouseOverPoint", function( serieName, id ) {
		focusId = id;
		renderer.getModule("focus").setText("Focus on point " + id );
	});
});

renderer.getModule("focus").on("clicked", function() {

	experiment.focusOn( focusId );

	if( focusId !== false ) {
		focusId = false;
		renderer.getModule("focus").setText("Stop focus" );
	}

});*/
/*
experiment.renderer.getModule("formConfig").on("validated", function( value ) {

	proc.config("pulses", value.timebase );
})
*/


function reprocess( chargesGlobal, vocsGlobal, capacitancesGlobal, delays, chargesFGlobal, capacitancesFGlobal ) {

	var i = 0;
	var colors = ['#a61111', '#2d2d94', '#479116', '#722f8b', '#a36228'];
	var colors2 = ['#cf6565', '#6565cf', '#a2c48b', '#b58bc4', '#ce9f75'];

	experiment.renderer.getModule("vocvstime").clear();
	experiment.renderer.getModule("C-t").clear();
	experiment.renderer.getModule("C-V").clear();
	experiment.renderer.getModule("C-t").setXLogScale( true );
	experiment.renderer.getModule("vocvstime").setXLogScale( true );

	experiment.renderer.getModule("chargesvstime").clear();
	experiment.renderer.getModule("chargesvstime").setXLogScale( true );

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
		var capacitances = capacitancesGlobal[ l ];

		var chargesF = chargesFGlobal[ l ];
		var capacitanceF = capacitancesFGlobal[ l ];

		var dataCharges = [], dataChargesSDev = [];
		var dataChargesF = [], dataChargesSDevF = [];

		var wTimeDelays = new Waveform();
		var wCapa = new Waveform();
		var wCapaS = new Waveform();

		var wCapaF = new Waveform();
		var wCapaSF = new Waveform();

		var wCharges = new Waveform();
		var wChargesS = new Waveform();

		var wChargesF = new Waveform();
		var wChargesSF = new Waveform();

		var wVocs = new Waveform();
		var wVocsS = new Waveform();

		wTimeDelays.setData( delays );

		charges.map( function( charge ) {

			var i = charges.indexOf( charge );

			dataCharges.push( [ delays[ i ], charge.median() ] );
			dataChargesSDev.push( [ [ charge.stdDev() ] ] );


			dataChargesF.push( [ delays[ i ], chargesF[ i ].median() ] );
			dataChargesSDevF.push( [ [ chargesF[ i ].stdDev() ] ] );

			wCharges.push( charge.median() );
			wChargesS.push( charge.stdDev() );

			wChargesF.push( chargesF[ i ].median() );
			wChargesSF.push( chargesF[ i ].stdDev() );
		});


		experiment.renderer.getModule("chargesvstime").newScatterSerie("chargesvstime_" + l, dataCharges, { }, dataChargesSDev, style );
	//	experiment.renderer.getModule("chargesvstime").newScatterSerie("chargesvstime_" + l + "_F", dataChargesF, { }, dataChargesSDevF, style2 );
		experiment.renderer.getModule("chargesvstime").autoscale();


		var dataVoc = [], dataVocSDev = [];
		vocs.map( function( voc ) {

			var i = vocs.indexOf( voc );

			dataVoc.push( [ delays[ i ], voc.median() ] );
			dataVocSDev.push( [ [ voc.stdDev() ] ] );

			wVocs.push( voc.median() );
			wVocsS.push( voc.stdDev() );
		});

		var dataCapa = [], dataCapaSDev = [];
		var dataCV = [], dataCVSdev = [];

		var dataCapaF = [], dataCapaSDevF = [];
		var dataCVF = [], dataCVSdevF = [];


		i = 0;
		capacitances.map( function( c ) {

			var i = capacitances.indexOf( c );

			dataCapa.push( [ delays[ i ], c.median() ] );
			dataCapaSDev.push( [ [ c.stdDev() ] ] );

			dataCV.push( [ vocs[ i ].median(), c.median() ] );
			dataCVSdev.push( [ [ c.stdDev() ] ] );

			dataCapaF.push( [ delays[ i ], capacitanceF[ i ].median() ] );
			dataCapaSDevF.push( [ [ capacitanceF[ i ].stdDev() ] ] );

			dataCVF.push( [ vocs[ i ].median(), capacitanceF[ i ].median() ] );
			dataCVSdevF.push( [ [ capacitanceF[ i ].stdDev() ] ] );


			wCapa.push( c.median() );
			wCapaS.push( c.stdDev() );

			wCapaF.push( capacitanceF[ i ].median() );
			wCapaSF.push( capacitanceF[ i ].stdDev() );

		});


		experiment.renderer.getModule("vocvstime").newScatterSerie("vocvstime_" + l, dataVoc, {}, dataVocSDev, style );
		experiment.renderer.getModule("vocvstime").autoscale();


		experiment.renderer.getModule("C-t").newScatterSerie("CT_" + l, dataCapa, { }, dataCapaSDev, style );
	//	experiment.renderer.getModule("C-t").newScatterSerie("CT_" + l + "_F", dataCapaF, { }, dataCapaSDevF, style2 );
		experiment.renderer.getModule("C-t").autoscale();



		experiment.renderer.getModule("C-V").newScatterSerie("CV_" + l, dataCV, { }, dataCVSdev, style );
	//	experiment.renderer.getModule("C-V").newScatterSerie("CV_" + l + "_F", dataCVF, { }, dataCVSdevF, style2 );
		experiment.renderer.getModule("C-V").autoscale();


		var itxw = itx.newWave( "voc_" + l );
		itxw.setWaveform( wVocs );

		var itxw = itx.newWave( "voc_sdev_" + l );
		itxw.setWaveform( wVocsS );

		var itxw = itx.newWave( "charges_" + l );
		itxw.setWaveform( wCharges );

		var itxw = itx.newWave( "charges_sdev_" + l );
		itxw.setWaveform( wChargesS );


		var itxw = itx.newWave( "charges_f_" + l );
		itxw.setWaveform( wChargesF );

		var itxw = itx.newWave( "charges_sdev_f_" + l );
		itxw.setWaveform( wChargesSF );


		var itxw = itx.newWave( "capacitance_" + l );
		itxw.setWaveform( wCapa );

		var itxw = itx.newWave( "capacitance_sdev_" + l );
		itxw.setWaveform( wCapaS );

		var itxw = itx.newWave( "capacitance_f_" + l );
		itxw.setWaveform( wCapaF );

		var itxw = itx.newWave( "capacitance_sdev_f_" + l );
		itxw.setWaveform( wCapaSF );
	}

	var itxw = itx.newWave( "times" );
	itxw.setWaveform( wTimeDelays );

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: "capa.itx",
		fileExtension: 'itx',
		dir: './capacitance/'
	} );
}
