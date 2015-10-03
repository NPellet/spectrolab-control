
var Promise = require('bluebird');

module.exports = function( config, app ) {


//	var ArduinoStage = app.getInstrument('arduino-stage');
	var ArduinoDIGIO = app.getInstrument('arduinoDigio');
	var PWS = app.getInstrument("PowerSupplyWhiteLED");
	var Keithley = app.getInstrument("KeithleySMU");

	PWS.setCurrentLimit( 0.7 );

	return new Promise( function( resolver, rejecter ) {

		var calibrationCurve = [];
		var minVoltage = 20;
		var maxVoltage = 29; // 1A ABSOLUTE maximum per LED
		var nbpointscalibration = 60;

		function processCalibration() {

			// Easiest implementation: Consider absolute linearity of the photodiode (good for Centronic 5T series, for example)

			calibrationCurve = calibrationCurve.map( function( pair ) {
				pair[ 1 ] /= config.currentat1sun;
				return pair;
			});

			// current vs sun intensity (1 = 1 sun)
			var retainedCalibration = [];

			retainedCalibration.push( calibrationCurve[ calibrationCurve.length - 1 ] ); // Add max intensity

			var oneSunIndex = findCalibrationPoint( 1 );

			// Spread across the remaining range, starting at one sun
			if( oneSunIndex ) {
				for( var i = 0, l = config.nbpointscalibrationcurve - 1; i < l; i ++ ) { // -2 because one point already exists

					if( Math.floor( ( 1 - i / ( l + 1 ) ) * oneSunIndex ) < 0 ) {
						break;
					}

					retainedCalibration.push( calibrationCurve[ Math.floor( ( 1 - i / ( l + 1 ) ) * oneSunIndex ) ] );
				}
			}

			var jsonOutput = [];
			for( var i = retainedCalibration.length - 1 ; i >= 0; i -- ) {
				jsonOutput.push( { voltage: retainedCalibration[ i ][ 0 ], sun: retainedCalibration[ i ][ 1 ], text: ( retainedCalibration[ i ][ 1 ] * 100 ).toPrecision( 4 ) + "% sun" } );
			}

			app.getConfig().instruments.PowerSupplyWhiteLED.voltage_sunoutput = jsonOutput;
			app.saveConfig();
			app.getLogger().log( "Calibration terminated ! " + jsonOutput.push + " calibration points created. Maximum sun intensity: " + jsonOutput[ jsonOutput.length - 1 ].text + ". Minimum sun intensity: " + jsonOutput[ 0 ].text );
			resolver();
		}

		function findCalibrationPoint( sunIntensity ) {

			for( var i = 0, l = calibrationCurve.length; i < l ; i ++ ) {
				if( calibrationCurve[ i ][ 1 ] < sunIntensity && calibrationCurve[ i + 1 ][ 1 ] > sunIntensity ) {
					return i;
				}
			}

			return false;
		}

		function calibrate( i ) {


			i = i || 0;


			if( i > nbpointscalibration ) {

				PWS.turnOff();
				processCalibration();
				return new Promise( function( resolver ) { resolver(); } );
			}


			levelRatio = ( Math.exp( i / nbpointscalibration * 2  ) - 1 ) / ( Math.exp( 2 ) - 1 ); // Between 0 and 1

			voltage = Math.round( ( maxVoltage - minVoltage ) * levelRatio * 10000 ) / 10000 + minVoltage;

			

			return new Promise( function( resolver, rejecter ) { 

				PWS.turnOff();
				PWS.setVoltageLimit( voltage ).then( function() {

					PWS.turnOn();
					setTimeout( function() {
		
						Keithley.measureJ( {

							channel: 'smub', // Standard channel
							nplc: '25', // High stability measurement
							settlingTime: 2, // Integrate for 2 seconds
							voltage: 0

						} ).then( function( jsc ) {

							
							if( jsc > 0 ) {
								app.getLogger().info( "Diode current @" + voltage + "V: " + jsc + "A (sun intensity: " + Math.round( jsc / config.currentat1sun * 100000 ) / 1000 + "%). Skipping."  );

							} else {
								app.getLogger().info( "Diode current @" + voltage + "V: " + jsc + "A (sun intensity: " + Math.round( jsc / config.currentat1sun * 100000 ) / 1000 + "%)"  );
								calibrationCurve.push( [ voltage, jsc ] );								
							}

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
			voltage;

		// Let's run a a calibration curve over 100 channels
	//	ArduinoStage.translateToPosition( config.referencePosition ).then( function() {
			ArduinoDIGIO.routeLEDToArduino( "white" );
			ArduinoDIGIO.turnLEDOn( "white" );
			

				return calibrate( );
		//	});
	//	});

	});
}
