
module.exports = function( config, app ) {

	var keithley = this.getInstrument("KeithleySMU");
	var arduino = this.getInstrument("arduinoDIGIO");
	var oscilloscope = this.getInstrument("tektronix-oscilloscope");
	var afg = this.getInstrument("tektronix-functiongenerator");

	var PWSWhite = this.getInstrument("PowerSupplyWhiteLED");
	var PWSColor = this.getInstrument("PowerSupplyColoredLED");

	arduino.routeLEDToArduino( "white" );


	var perturbationIteration = 0.01;
	var perturbationValue = 0;

	return new Promise( function( resolver, rejecter ) {

		function *tpv() {

			var i = 0;
			var sunLevel;
			var TPV;

			var levels = app.getConfig().instruments.PWSWhiteLight.current_sunoutput;

			arduino.turnLEDOn("white");
			arduino.routeLEDToAFG( config.pulseColor, config.afgChannel );

			while( true ) {
				
				sunLevel = levels[ i ];

				afg.enableChannel( 1 );

				perturbation( 0.01 ).then( function( d ) {
					TPV = d;
					method.next();
				} );

				yield;
				
				TPV.subtract( TPV.getAverageP( 0, 0.04 * self.recordLength ) );
				TPV.divideBy( TPV.getAverageP( 0.14 * self.recordLength, 0.15 * self.recordLength ) );
				TPV.shiftX( - TPV.getXFromIndex( 0.15 * self.recordLength ) );


				progress( "TPV", TPL, sunLevel );

				if( i == levels.length - 1 ) {
					break;
				}	
			}

			resolver();

			afg.disableChannels();
			
			arduino.turnLEDOff("white");
		};


		var method = tpv();
		method.next();

	});

	// Applicable with jsc and voc
	function perturbation(  ) {

		var self = this,
		
		PWSColor.setCurrentLimit( perturbationValue );

		return new Promise( function( resolver, rejecter ) {
			
			var perturbed = 0;
			
			function *perturbator() {

				var max = false;

				oscilloscope.setNbAverage( 100 );
				oscilloscope.stopAfterSequence( false );
				oscilloscope.startAquisition();
				while( true ) {

					if( perturbed < level && max == false ) {

						perturbationValue += perturbationIteration;
						PWSColor.setCurrentLimit( perturbationValue );

						oscilloscope.clear();
						oscilloscope.startAquisition();
						oscilloscope.clear();
						
						self.wait( 2 ).then( function() {

							oscilloscope.getMeasurementMean( 1 ).then( function( results ) {

								perturbed = results;
								pert.next();

							} );

						} );

					} else {

						oscilloscope.stopAquisition();
						oscilloscope.clear();
						oscilloscope.setNbAverage( config.averaging );
						oscilloscope.stopAfterSequence( true );
						oscilloscope.startAquisition();

						oscilloscope.ready().then( function() {

							oscilloscope.getWaves().then( function( w ) {
								resolver( w[ 3 ] );
							});

						});

						break;
					}


					yield;
				}
			}

			var pert = perturbator();
			pert.next();
		});
	}

	function setup() {

		/* AFG SETUP */
		afg.enableBurst( config.afgChannel );
		afg.setShape( config.afgChannel, "PULSE" );
		afg.setPulseHold( config.afgChannel, "WIDTH" );
		afg.setBurstTriggerDelay( config.afgChannel, 0 );
		afg.setBurstMode( config.afgChannel, "TRIGGERED");
		afg.setBurstNCycles( config.afgChannel, 1 );
		afg.setVoltageLow( config.afgChannel, 0 );
		afg.setVoltageHigh( config.afgChannel, 1.5 );
		afg.setPulseLeadingTime( config.afgChannel, 9e-9 );
		afg.setPulseTrailingTime( config.afgChannel, 9e-9 );
		afg.setPulseDelay( config.afgChannel, 0 );
		afg.setPulsePeriod( config.afgChannel, 11e-3 );
		afg.setPulseWidth( config.afgChannel, 1e-3 );
		afg.disableChannels( ); // Set the pin LOW
		afg.getErrors();

		afg.disableBurst( config.afgChannel );

		/* KEITHLEY SETUP */
		keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
		keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off
		keithley.command( "smub.source.highc = smub.ENABLE;" ); // Turn the output off
		keithley.setDigioPin( 4, 1 ); // Turn white light on

		/* OSCILLOSCOPE SETUP */
		oscilloscope.enableAveraging();

		oscilloscope.setCoupling( 1, "DC");
		oscilloscope.setCoupling( 2, "GND");
		oscilloscope.setCoupling( 3, "AC");
		oscilloscope.setCoupling( 4, "GND");

		oscilloscope.disable50Ohms( 3 );
		oscilloscope.setRecordLength( this.recordLength );

		oscilloscope.setVerticalScale( 3, 1e-3 );
		oscilloscope.setPosition( 3, -4 );
		oscilloscope.setOffset( 3, 0 );

		oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
		oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
		oscilloscope.setTriggerSlope( 1, "FALL" ); // Trigger on bit going up
		oscilloscope.setTriggerLevel( 0.7 ); // TTL down
		oscilloscope.setTriggerRefPoint( 15 );

		oscilloscope.enableChannels();

		oscilloscope.setTriggerMode("NORMAL");
		oscilloscope.setHorizontalScale( 1e-3 );
		oscilloscope.setMeasurementType( 1, "AMPLITUDE" );
		oscilloscope.setMeasurementSource( 1, 3 );
		oscilloscope.enableMeasurement( 1 );

		oscilloscope.setMeasurementType( 2, "MEAN" );
		oscilloscope.setMeasurementSource( 2, 3 );
		oscilloscope.enableMeasurement( 2 );

		oscilloscope.setMeasurementType( 3, "MINImum" );
		oscilloscope.setMeasurementSource( 3, 3 );
		oscilloscope.enableMeasurement( 3 );

		oscilloscope.setMeasurementType( 4, "Pk2Pk" );
		oscilloscope.setMeasurementSource( 4, 3 );
		oscilloscope.enableMeasurement( 4 );

		oscilloscope.stopAfterSequence( true );

		return oscilloscope.ready();
	}

};