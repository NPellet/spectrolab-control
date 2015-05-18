
	var Waveform = require('../../server/waveform');

	var experiment = {

		// Experiment idea
		// AFG is used to send light pulses. We should use colored diodes as they can flash a lot faster
		// Diodes are on channel 1, transistor is on channel 2.
		// As channel 1 is switched to LOW, the channel 2 is switched to HIGH, thereby shortcircuiting the device.
		// The Jsc decay is recorded on the scope. We can only put the jsc is DC mode as during the pulse, the device is a Voc (not Jsc !). Anyway AC or DC should be irrelevant and yield the same, as the device has 0mA during the pulse.
		// If the pre-pulse is available on Channel 3, we can leave channel 3 on AC mode. We cannot trust the decay as it will drop to 0.

		init: function( parameters ) {

			experiment.parameters = parameters;

			experiment.oscilloscope = parameters.instruments["tektronix-oscilloscope"].instrument;
			experiment.keithley = parameters.instruments["keithley-smu"].instrument;
			experiment.arduino = parameters.instruments.arduino.instrument;
			experiment.afg = parameters.instruments["tektronix-functiongenerator"].instrument;

			experiment.parameters.period = 10;
			experiment.parameters.pulseTime = 1;//150e-6;
			experiment.parameters.averaging = 200;
		},

		run: function() {

			var afg = experiment.afg;
			var keithley = experiment.keithley;
			var oscilloscope = experiment.oscilloscope;
			var arduino = experiment.arduino;


			/* KEITHLEY SETUP */
			keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off
			keithley.command( "smub.source.highc = smub.DISABLE;" ); // Turn the output off

			keithley.setDigioPin( 4, 0 ); // Turn white light on

			/* OSCILLOSCOPE SETUP */
			oscilloscope.enableAveraging();

			oscilloscope.setCoupling( 1, "DC");
			oscilloscope.setCoupling( 2, "GND");
			oscilloscope.setCoupling( 3, "GND");
			oscilloscope.setCoupling( 4, "GND");

			oscilloscope.disableChannels( );

			oscilloscope.setRecordLength( 50000 );
			oscilloscope.setVerticalScale( 3, 120e-3 );
			oscilloscope.setHorizontalScale( 2 * experiment.parameters.pulseTime );
			oscilloscope.enable50Ohms( 3 );

			oscilloscope.setOffset( 3, 0 );
			oscilloscope.setPosition( 3, 0 );

			oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
			oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
			oscilloscope.setTriggerSlope( 1, "RISE" ); // Trigger on bit going up
			oscilloscope.setTriggerLevel( 0.7 ); // TTL down

			oscilloscope.setTriggerMode( "NORMAL" );

			afg.disableChannel( 1 );
			arduino.setWhiteLightLevel( 8 );

			experiment.iv().then( function( iv ) {

				afg.setShape( 1, "DC" );
				afg.setVoltageOffset( 1, 2 );
				afg.enableChannel( 1 );



				experiment.progress( 'iv', [ iv ] );


				experiment.iv().then( function( iv ) {

					experiment.progress( 'iv', [ iv ] );
					oscilloscope.setCoupling( 3, "DC");

					keithley.command("smub.sense = smub.SENSE_LOCAL")
					/* AFG SETUP */
					afg.enableBurst( 1 );
					afg.setShape( 1, "PULSE" );
					afg.setPulseHold( 1 , "WIDTH" );
					afg.setBurstTriggerDelay(  1, 0 );
					afg.setBurstMode( 1, "TRIGGERED");
					afg.setBurstNCycles( 1, 1 );
					afg.setVoltageLow( 1, 0 );
					afg.setVoltageHigh( 1, 1.5 );
					afg.setPulseLeadingTime( 1, 9e-9 );
					afg.setPulseTrailingTime( 1, 9e-9 );
					afg.setPulseDelay( 1, 0 );
					afg.setPulsePeriod( 1, experiment.parameters.period );
					afg.setPulseWidth( 1, experiment.parameters.pulseTime );
					afg.disableChannels( ); // Set the pin LOW
					afg.getErrors();





					arduino.setColorLightLevelVoltage( 1600 );
					oscilloscope.enable50Ohms( 3 );

					oscilloscope.clear();
					afg.enableChannel( 1 );

					var jscTransient;
					oscilloscope.setNbAverage( 16 );
					oscilloscope.enableChannel( 1 );
					oscilloscope.enableChannel( 3 );
					oscilloscope.stopAfterSequence( true );


					keithley.sourcev( {

						channel: 'smub',
						bias: -2,
						complianceV: 10
					}).then( function() {
						console.log('biased !');
					});


					experiment.wait( 5 ).then( function() {
	console.log('WAITED');

						oscilloscope.clear();
						oscilloscope.startAquisition();


						oscilloscope.ready().then( function() {
	console.log('READY');
							oscilloscope.getMeasurementMean( 1, 2, 4 ).then( function( results ) {

	console.log('MEAS');
	console.log( results );

								var mean = results[ 1 ];

								oscilloscope.setVerticalScale( 3, 2e-3 );
								oscilloscope.setOffset( 3, mean );
								oscilloscope.setPosition( 3, 0 );

								oscilloscope.clear();
								oscilloscope.setNbAverage( 200 );
								oscilloscope.startAquisition();

								oscilloscope.ready().then( function() {
									afg.disableChannel( 1 );

									oscilloscope.getChannel( 3 ).then( function( wave3 ) {

										jscTransient = wave3;
										experiment.progress( "jscTransient", [ jscTransient ] );
									});
								});




							});
						});
					});
				});


			});

		},

		iv: function() {
			var keithley = experiment.keithley;
			return keithley.sweepIV( {
				channel: 'smub',
				hysteresis: true,
				scanRate: 200,
				startV: -1,
				stopV: 1,
				timeDelay: 5
			})
		},

		getVoc: function() {
			var keithley = experiment.keithley;
			return keithley.measureVoc( {
				channel: 'smub',
				settlingTime: 3
			})
		},

		getJsc: function() {
			var keithley = experiment.keithley;
			return keithley.measureIsc( {
				channel: 'smub',
				settlingTime: 3
			})
		},

		setLight: function( l ) {
			experiment.arduino.setWhiteLightLevelVoltage( l );
			return new Promise( function( resolver ) {
				resolver();
			});
		}
	}

	module.exports = experiment;
