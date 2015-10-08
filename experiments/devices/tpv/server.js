var color = require("color");

module.exports = function( config, app ) {

	var keithley = app.getInstrument("KeithleySMU");
	var arduino = app.getInstrument("arduinoDigio");
	var oscilloscope = app.getInstrument("tektronix-oscilloscope");
	var afg = app.getInstrument("tektronix-functiongenerator");

	var PWSWhite = app.getInstrument("PowerSupplyWhiteLED");
	var PWSColor = app.getInstrument("PowerSupplyColoredLED");
	PWSColor.setCurrentLimit( 0.7 );
	PWSWhite.setCurrentLimit( 1 );

	arduino.routeLEDToArduino( "white" );

	var perturbationIteration = 0.1;
	var perturbationValue = 6.4;

	var recordLength = 10000;
	var timescale = 5e-3;

	config.afgChannel = "A";
	
	var c = color().hsl( 90, 100, 35 );
	var igorfile = app.itx();

		function progress( TPV, sunLevel ) {

			renderer.getModule( "vocDecay" ).newSerie( "lastVocDecay_" + sunLevel.sun, TPV, { lineColor: c.rgbString() } );
			renderer.getModule( "vocDecay" ).autoscale();

			var itxw = igorfile.newWave( "TPV_" + sunLevel.sun );
			itxw.setWaveform( TPV );

			c.rotate( 270 / 13 );

       		var fileName = app.save( "tpv/", igorfile.getFile(), app.getDeviceName(), "itx" );
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
			afg.setPulsePeriod( config.afgChannel, config.pulsewidth * 15	 );
			afg.setPulseWidth( config.afgChannel, config.pulsewidth );
			afg.disableChannels( ); // Set the pin LOW
			afg.getErrors();

			afg.disableBurst( config.afgChannel );

			/* KEITHLEY SETUP */
			keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off
			keithley.command( "smub.source.highc = smub.ENABLE;" ); // Turn the output off


			/* OSCILLOSCOPE SETUP */
			oscilloscope.enableAveraging();

			oscilloscope.setCoupling( 1, "AC");
			oscilloscope.setCoupling( 2, "GND");
			oscilloscope.setCoupling( 3, "DC");
			oscilloscope.setCoupling( 4, "GND");

			oscilloscope.disable50Ohms( 1 );
			oscilloscope.setRecordLength( recordLength );

			oscilloscope.setVerticalScale( 1, 1e-3 );
			oscilloscope.setVerticalScale( 3, 2 );
			oscilloscope.setPosition( 1, -2 );
			oscilloscope.setOffset( 1, 0 );

			oscilloscope.setTriggerToChannel( 3 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
			oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
			oscilloscope.setTriggerSlope( 1, "FALL" ); // Trigger on bit going up
			oscilloscope.setTriggerLevel( 0.7 ); // TTL down
			oscilloscope.setTriggerRefPoint( 15 );

			oscilloscope.enableChannels();

			oscilloscope.setTriggerMode("NORMAL");
			oscilloscope.setHorizontalScale( config.pulsewidth );

			oscilloscope.setMeasurementType( 1, "AMPLITUDE" );
			oscilloscope.setMeasurementSource( 1, 1 );
			oscilloscope.enableMeasurement( 1 );

			oscilloscope.setMeasurementType( 2, "MEAN" );
			oscilloscope.setMeasurementSource( 2, 1 );
			oscilloscope.enableMeasurement( 2 );

			oscilloscope.setMeasurementType( 3, "Pk2Pk" );
			oscilloscope.setMeasurementSource( 3, 1 );
			oscilloscope.enableMeasurement( 3 );

			oscilloscope.setMeasurementType( 4, "FALL" );
			oscilloscope.setMeasurementSource( 4, 1 );
			oscilloscope.enableMeasurement( 4 );

			oscilloscope.stopAfterSequence( true );

	 	 	  return app.ready( keithley, arduino, afg, oscilloscope, PWSWhite, PWSColor );
		}



	setup();


	return new Promise( function( resolver, rejecter ) {

		function *tpv() {

			var i = 0;
			var sunLevel;
			var TPV;

			config.pulseColor = "red";

			var levels = app.getConfig().instruments.PowerSupplyWhiteLED.voltage_sunoutput;

			app.getLogger().info("Routing DC White LED to Arduino.")
			app.getLogger().info("Routing DC Colored LED to AFG.")

			arduino.turnLEDOn("white");
			arduino.routeLEDToAFG( config.pulseColor, config.afgChannel );
			
			while( true ) {
				
				sunLevel = levels[ i ];

				app.getLogger().info("Setting current to white LED. Voltage: " + levels[ i ].voltage + "V. Sun intensity: " + levels[ i ].text );
				
				Promise.all( [ PWSWhite.setVoltageLimit( levels[ i ].voltage ), PWSWhite.turnOn(), PWSColor.turnOn(), afg.enableChannel( 1 ) ], oscilloscope.setHorizontalScale( config.pulsewidth  ) ).then( function() {
					
					perturbation( ).then( function( d ) {
						TPV = d;
						method.next();
					} );
				} );


				yield;
				
				//TPV.subtract( TPV.getAverageP( 0, 0.04 * recordLength ) );
				TPV.divideBy( TPV.getAverageP( 0.14 * recordLength, 0.15 * recordLength ) );
				TPV.shiftX( - TPV.getXFromIndex( 0.15 * recordLength ) );

				progress( TPV, sunLevel );

				i++;

				if( i == levels.length ) {
					break;
				}	
			}

			resolver();

			afg.disableChannels();
			
			arduino.turnLEDOff("white");
		};


		var method = tpv();
		method.next();

		// Applicable with jsc and voc
		function perturbation(  ) {

			var self = this;
			
			PWSColor.setVoltageLimit( perturbationValue );
			oscilloscope.setVerticalScale( 1, 2e-3 );


			var level = 4e-3;

			return new Promise( function( resolver, rejecter ) {
				
				var perturbed = 0;

				function *perturbator() {

					var max = false;

					perturbationValue -= perturbationIteration;

					oscilloscope.setNbAverage( config.trialaveraging );
					oscilloscope.stopAfterSequence( false );
					
					while( true ) {

						if( perturbed < level && max == false && perturbationValue < 15 ) {

							app.getLogger().info( "Perturbation is not strong enough (" + perturbed + " vs " + level + "). Ramping up to " + ( perturbationValue + perturbationIteration )  );

							perturbationValue += perturbationIteration;
							PWSColor.setVoltageLimit( perturbationValue );
							oscilloscope.stopAfterSequence( true );
							oscilloscope.clear();

							setTimeout( function() {

								oscilloscope.startAquisition();
								
								oscilloscope.whenready().then( function() {

									oscilloscope.getMeasurementMean( 1, 4, 3 ).then( function( results ) {

										perturbed = results[ 0 ];
										timescale = results[ 1 ];
										pert.next();	
								
									} );
								} );

							}, 1000 );
							
							yield;

						} else {

								app.getLogger().info("Perturbation was strong enough");

							
							if( timescale > 1e-3 && config.dc ) {
								console.log("Switching to DC");

								oscilloscope.stopAquisition();
								oscilloscope.setCoupling( 1, "DC");
								oscilloscope.setVerticalScale( 1, 200e-3 );
								oscilloscope.setNbAverage( 1 );
								oscilloscope.stopAfterSequence( false );
								oscilloscope.startAquisition();
								
								setTimeout( function() {

									
									oscilloscope.getMeasurementValue( 2 ).then( function( results ) {
										console.log("Mean: ", results );
										oscilloscope.setOffset( 1, results );
										oscilloscope.setVerticalScale( 1, 4e-3 );
										oscilloscope.setPosition( 1, 0 );
										oscilloscope.stopAquisition();
										oscilloscope.stopAfterSequence( true );


										pert.next();
									});

								}, 30000 );
						
								yield;

							} else {

								oscilloscope.setPosition( 1, -3 );
								oscilloscope.setCoupling( 1, "AC");
								oscilloscope.setVerticalScale( 1, perturbed  / 5 );

								if( timescale < 5e-6 ) {
									timescale = 5e-6;
								}
							}

							oscilloscope.stopAquisition();
							oscilloscope.clear();
							oscilloscope.setNbAverage( 400 );
							oscilloscope.setHorizontalScale( timescale / 2 );
							oscilloscope.stopAfterSequence( true );
							oscilloscope.startAquisition();

							setTimeout( function() {

								oscilloscope.whenready().then( function() {

									oscilloscope.getWaves().then( function( w ) {
										resolver( w[ 1 ] );
									});

								}, 2000 );

	
							})
							
							break;
						}
					}
				}

				var pert = perturbator();
				pert.next();
			});
		}


	});

};