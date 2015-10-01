
var Promise = require('bluebird');

module.exports = function( config, app ) {


//	var ArduinoStage = app.getInstrument('arduino-stage');
	var ArduinoDIGIO = app.getInstrument('arduinoDigio');
	var PWS = app.getInstrument("PowerSupplyWhiteLED");
	var Keithley = app.getInstrument("KeithleySMU");


	return new Promise( function( resolver, rejecter ) {

		var calibrationCurve = [];
		var maxCurrent = 1; // 1A ABSOLUTE maximum per LED
		var nbpointscalibration = 100;

		function processCalibration() {

			// Easiest implementation: Consider absolute linearity of the photodiode (good for Centronic 5T series, for example)

			var calibrationCurve = calibrationCurve.map( function( pair ) {
				pair[ 1 ] /= config.currentAt1Sun;
			});

			// current vs sun intensity (1 = 1 sun)
			var retainedCalibration = [];

			retainedCalibration.push( calibrationCurve[ calibrationCurve.length - 1 ] ); // Add max intensity

			var oneSunIndex = findCalibrationPoint( 1 );

			// Spread across the remaining range, starting at one sun
			if( oneSunIndex ) {
				for( var i = 0, l = config.nbpointscalibrationcurve - 1; i < l; i ++ ) { // -2 because one point already exists
					retainedCalibration.push( calibrationCurve[ Math.floor( ( 1 - i / ( l + 1 ) ) * oneSunIndex ) ] );
				}
			}

			var jsonOutput = {};

			for( var i = retainedCalibration.length - 1 ; i >= 0; i -- ) {

				jsonOutput.push( { current: retainedCalibration[ i ][ 0 ], sun: retainedCalibration[ i ][ 1 ], text: ( retainedCalibration[ i ][ 1 ] * 100 ).toPrecision( 4 ) } );
			}

			app.getConfig().instruments.PowerSupplyWhiteLED.current_sunoutput = jsonOutput;

			console.log( app.getConfig() );
		//	app.saveConfig();

			resolver();
		}

		function findCalibrationPoint( sunIntensity ) {

			for( var i = 0, l = nbpointscalibration - 2; i < l ; i ++ ) {
				if( calibrationCurve[ i ][ 1 ] < sunIntensity && calibrationCurve[ i + 1 ][ 1 ] > sunIntensity ) {
					return i;
				}
			}

			return false;
		}

		function calibrate( i ) {


			i = i || 0;
console.log( "NUM:", nbpointscalibration, i );
			if( i > nbpointscalibration - 1 ) {
				processCalibration();
				return new Promise( function( resolver ) { resolver(); } );
			}


			levelRatio = ( Math.exp( i / nbpointscalibration ) - 1 ) / ( Math.E - 1 ); // Between 0 and 1

			console.log( levelRatio, maxCurrent );
			current = Math.round( maxCurrent * levelRatio * 1000 ) / 1000;

			

			return new Promise( function( resolver, rejecter ) { 

				PWS.setCurrentLimit( current ).then( function() {

					setTimeout( function() {
		
						Keithley.measureJ( {

							channel: 'smub', // Standard channel
							nplc: '25', // High stability measurement
							settlingTime: 2, // Integrate for 2 seconds
							voltage: 0

						} ).then( function( jsc ) {
console.log('CALIBRATED ' + i );
							calibrationCurve.push( [ current, jsc ] );
							calibrate( i + 1 ).then( function() {
								resolver();
							} );

						} );

					}, 1000 ); // 1 s settling time to let the power ramp up and the LED stabilize


				});
				
			} );
		}

		PWS.setVoltageLimit( 3.00 * 8 ); // 3V per LED, 8 LEDs in series => roughly 24V maximum (anyway, current controlled)
		

		// Running variables
		var levelRation,
			current;

		// Let's run a a calibration curve over 100 channels
	//	ArduinoStage.translateToPosition( config.referencePosition ).then( function() {
			ArduinoDIGIO.routeLEDToArduino( "white" );
			ArduinoDIGIO.turnLEDOn( "white" );
			

				return calibrate( );
		//	});
	//	});

	});
}
