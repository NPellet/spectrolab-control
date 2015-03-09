
var Waveform = require('../../server/waveform');
var _ = require('lodash');

var experiment = {

	// Experiment idea
	// AFG is used to send light pulses. We should use colored diodes as they can flash a lot faster
	// Diodes are on channel 1, transistor is on channel 2.
	// As channel 1 is switched to LOW, the channel 2 is switched to HIGH, thereby shortcircuiting the device.
	// The Jsc decay is recorded on the scope. We can only put the jsc is DC mode as during the pulse, the device is a Voc (not Jsc !). Anyway AC or DC should be irrelevant and yield the same, as the device has 0mA during the pulse.
	// If the pre-pulse is available on Channel 3, we can leave channel 3 on AC mode. We cannot trust the decay as it will drop to 0.

	init: function( parameters ) {

		experiment.parameters = parameters;

		experiment.oscilloscope = parameters.instruments["gould-oscilloscope"].instrument;
		experiment.keithley = parameters.instruments["keithley-smu"].instrument;
		experiment.arduino = parameters.instruments.arduino.instrument;
		experiment.afg = parameters.instruments["tektronix-functiongenerator"].instrument;


		experiment.parameters.ledPin = 4;
		experiment.parameters.switchPin = 5;
		experiment.parameters.pulseTime = 10e-3 // 20 us ?
		experiment.parameters.currentDecayTime = 50e-3;
		experiment.parameters.period = 150e-3;//( experiment.parameters.pulseTime + experiment.parameters.currentDecayTime ) * 1.1;
		experiment.parameters.timebase = 50e-6;//( experiment.parameters.pulseTime + experiment.parameters.currentDecayTime ) * 1.1;
		experiment.parameters.averaging = 512;
		experiment.parameters.totalTime = experiment.parameters.averaging * experiment.parameters.period * 100; // 3 seconds in total => defined number of pulses

		experiment.parameters.totalTime = 60
		experiment.parameters.maxCurrent = 3e-3; // => Used to calculate max voltage over

	},


	focusOn: function( id ) {
		experiment.focus = id;
	},

	config: {

		pulses: function( val ) {
			var timeBases = [];
			var voltScales = [];
			val.map( function( v ) {

				timeBases.push( v.timebase );
				voltScales.push( v.voltscale );
			});

			experiment.timeBases = timeBases;
			experiment.yScales = voltScales;
		},

		focus: function( focusid ) {
			experiment.focus = focusid;
		}
	},

	run: function() {

			var waveVoc = new Waveform();
			var waveJsc = new Waveform();
			var wavedV = new Waveform();
			var wavedQ = new Waveform();
			var wavedC = new Waveform();
			var waveArduinoV = new Waveform();
			var waveArduinoVColor = new Waveform();

			var self = experiment;

			var afg = experiment.afg;
			var keithley = experiment.keithley;
			var oscilloscope = experiment.oscilloscope;


			var preTrigger = 30;


			keithley.setDigioPin( 4, 1 );


			/* AFG SETUP */

			afg.enableBurst( 1 );
			afg.enableBurst( 2 );

			afg.setShape( 1, "PULSE" );
			afg.setShape( 2, "PULSE" );


			afg.setPulseHold( 1 , "WIDTH" );
			afg.setPulseHold( 2 , "WIDTH" );


			afg.setBurstTriggerDelay(  1, 0 );
			afg.setBurstTriggerDelay(  2, 0 );

			afg.setBurstMode( 1, "TRIGGERED");
			afg.setBurstMode( 2, "TRIGGERED");
			afg.setBurstNCycles( 1, 1 );
			afg.setBurstNCycles( 2, 1 );

			afg.setVoltageLow( 1, 0 );
			afg.setVoltageHigh( 1, 1.5 );

			afg.setVoltageLow( 2, 0 )
			afg.setVoltageHigh( 2, 1 );


			afg.setPulseLeadingTime( 1, 9e-9 );
			afg.setPulseTrailingTime( 1, 9e-9 );

			afg.setPulseLeadingTime( 2, 9e-9 );
			afg.setPulseTrailingTime( 2, 9e-9 );

			afg.setPulseDelay( 1, 0 );
			afg.setPulseDelay( 2, experiment.parameters.pulseTime ); // Has to adapt to the pulse width

			afg.setPulsePeriod( 1, experiment.parameters.period );
			afg.setPulsePeriod( 2, experiment.parameters.period );

			afg.setPulseWidth(  1, experiment.parameters.pulseTime );
			afg.setPulseWidth(  2, experiment.parameters.currentDecayTime );

			afg.getErrors();

			oscilloscope.setTimeBase( experiment.parameters.timebase );
			oscilloscope.enableAveraging();
			oscilloscope.setAveraging( experiment.parameters.averaging );

			oscilloscope.enable50Ohms( 2 );
			oscilloscope.disable50Ohms( 3 );

			keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off

			oscilloscope.setVoltScale( 2, 5e-3 ); // This needs to be adapted during the experiment.


			oscilloscope.setVoltScale( 3, 100e-3 ); // 20mV over channel 3
			oscilloscope.setVoltScale( 4, 1 ); // 1V over channel 4

			oscilloscope.setCoupling( 1, "DC");
			oscilloscope.setCoupling( 2, "DC");
			oscilloscope.setCoupling( 3, "AC");
			oscilloscope.setCoupling( 4, "DC");

			oscilloscope.setTriggerToChannel( "A", 4 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
			oscilloscope.setTriggerCoupling( "A", "DC" ); // Trigger coupling should be DC
			oscilloscope.setTriggerSlope("A", "UP"); // Trigger on bit going up
			oscilloscope.setTriggerLevel("A", 2); // Trigger on bit going up
			oscilloscope.setPreTrigger( "A", preTrigger ); // Set pre-trigger, 10%


			keithley.command("exit()"); // Reset keithley


			oscilloscope.setChannelPosition( 3, -2.5 );
			oscilloscope.setTriggerLevel( "A", 0.7 ); // Set trigger to 0.7V

			return new Promise( function( resolver, rejecter ) {




			self.oscilloscope.ready.then( function() {

				oscilloscope.setTriggerLevel("A", 1); // Trigger on bit going up



				function *pulse( ) {


						var l = 0;
						var voltage = 0;

						var minV = self.arduino.params.whiteLightLED.lowestSunLevel;
						var maxV = self.arduino.params.whiteLightLED.highestSunLevel;

						var minV = 1900;
						var maxV = 1900;


						afg.setShape( 1, "DC" );
						afg.setVoltageOffset( 1, 1.5 ); // Turn on red LEDs on channel on
						afg.disableChannels( ); // Set the pin LOW
						var arduinoV = minV;
						var voltage, jsc;

						while( true ) {

								self.arduino.setWhiteLightLevelVoltage( arduinoV );

								setTimeout( function() { p.next(); }, 2000 );
								yield;


								keithley.measureVoc( { channel: "smub", settlingTime: 1 } ).then( function( v ) {
									voltage = v;
									console.log( voltage );
									waveVoc.push( voltage );
									p.next();
								} );
								yield;

								keithley.measureIsc( { channel: "smub", settlingTime: 1 } ).then( function( j ) {
									jsc = j;
									console.log("Jsc:" + jsc );
									waveJsc.push( jsc );
									p.next();
								} );
								yield;
								console.log("End measuring, turning perturbation light on");
								waveArduinoV.push( arduinoV );

								var i = 0;

								var low = 500;
								var high = 1200;
								var seed = 800;

								while( true ) {
									afg.disableChannel( 1 );
									self.arduino.setColorLightLevelVoltage( seed );
									// Set the pin LOW
									keithley.measureVoc( { channel: "smub", settlingTime: 1 } ).then( function( v ) {
										voltage = v;
										p.next();
									} );

									yield;

									if( voltage < 0 ) {
										continue;
									}

									afg.enableChannel( 1 ); // Set the pin LOW

									keithley.measureVoc( { channel: "smub", settlingTime: 1 } ).then( function( voltagePerturb ) {


										var diff = voltagePerturb - voltage;
										console.log( voltage, voltagePerturb, voltagePerturb / voltage, seed, diff );
										if( ( ( voltagePerturb < voltage * 1.2 || diff > 30e-3 ) && diff < 50e-3) && ( voltagePerturb > voltage * 1.05 || diff > 30e-3 ) ) { // If perturbation is between 5 and 20%
											p.next( true );
											return;
										}

										if( voltagePerturb > voltage * 1.2 || diff > 40e-3 ) { // Too big

											var seed2 = (low + seed) / 2;
											high = seed;
											seed = seed2;

										} else if( voltagePerturb < voltage * 1.05 ) { // Too low

											var seed2 = (high + seed) / 2;
											low = seed;
											seed = seed2;

										}

										p.next( false );
										return;

									} );

									var cont = yield;
									i++;

									if( i > 5 || cont ) {
										console.log( i, cont );
										waveArduinoVColor.push( seed );
										break;
									}
								}


								arduinoV += 50;

								if( arduinoV > maxV ) {
									break;
								}
						}

						self.progress( "Voc-Isc", [ waveVoc, waveJsc, waveArduinoV, waveArduinoVColor ] );
						afg.setShape( 1, "PULSE" );
						afg.enableBurst( 1 );
						afg.enableBurst( 2 );


						afg.setVoltageLow( 1, 0 );
						afg.setVoltageHigh( 1, 1.5 );

						afg.enableChannels();

						var k = 0;
						while( true ) {

							var voltage = waveArduinoV.get( k );
							var perturbation = waveArduinoVColor.get( k );

							self.arduino.setWhiteLightLevelVoltage( voltage );
							oscilloscope.setChannelOffset( 2, - 50 * waveJsc.get( k ) );
							oscilloscope.setChannelOffset( 3, 0);

							afg.disableChannel( 1 );

							var blankCurrent;
							self.pulse( ).then( function( w ) {

								blankCurrent = w[ "2" ];

								if( ! self._paused ) {
									p.next();
								} else {
									self.paused();
								}

							});
							yield;

							afg.enableChannel( 1 );

							self.pulse( ).then( function( w ) {

								w[ "2" ].subtract( blankCurrent );
								var q = w[ "2" ].integrateP( preTrigger / 100 * 500, 499 );
								console.log( "CHARGE:", q, q / 30e-3 );
								experiment.progress("current", [ w["2"] ] );
								
								if( ! self._paused ) {
									p.next();
								} else {
									self.paused();
								}

							});
							yield;

							l++;

							self.progress( waveVoc, wavedV, wavedQ, wavedC );

							if( voltage > 21700 ) {
								break;
							}
					} // end while true

					resolver( [ waveVoc, wavedV, wavedQ, wavedC ] );
			} // end generator


			var p = pulse();
			p.next( );
			self.iterator = p;


			}); // End oscilloscope ready

		}); // End returned promise

	},

		pulse: function( ) {

			var self = experiment;

			return new Promise( function( resolver, rejecter ) {

				setTimeout( function() {

					return self.oscilloscope.getWaves().then( function( allWaves ) {

							setTimeout( function() {
								resolver( allWaves );
							}, 1000)


					});



				}, self.parameters.totalTime * 1000 );

			} );
		}
}


module.exports = experiment;
