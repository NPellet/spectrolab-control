
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
		experiment.parameters.pulseTime = 400e-6 // 20 us ?
		experiment.parameters.currentDecayTime = 400e-6;
		experiment.parameters.period = 1000e-6;//( experiment.parameters.pulseTime + experiment.parameters.currentDecayTime ) * 1.1;
		experiment.parameters.timebase = 20e-6;//( experiment.parameters.pulseTime + experiment.parameters.currentDecayTime ) * 1.1;
		experiment.parameters.averaging = 512;
		experiment.parameters.totalTime = experiment.parameters.averaging * experiment.parameters.period * 10; // 3 seconds in total => defined number of pulses
		experiment.parameters.totalTime = 80;
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
			afg.setPulseDelay( 2, experiment.parameters.pulseTime ); // Has to adapt to the pulse width
			afg.setPulsePeriod( 1, experiment.parameters.period );
			afg.setPulseWidth(  1, experiment.parameters.pulseTime );


			afg.setShape( 2, "DC" );
			afg.setVoltageOffset( 2, 2 );

			afg.disableChannels( ); // Set the pin LOW

			afg.getErrors();
			oscilloscope.enableAveraging();
			oscilloscope.setAveraging( experiment.parameters.averaging );
			oscilloscope.enable50Ohms( 2 );
			oscilloscope.disable50Ohms( 3 );

			keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off
			keithley.command( "smub.source.highc = smub.ENABLE;" ); // Turn the output off

			oscilloscope.setVoltScale( 2, 2e-3 ); // This needs to be adapted during the experiment.


			oscilloscope.setVoltScale( 3, 10e-3 ); // 20mV over channel 3
			oscilloscope.setVoltScale( 4, 1 ); // 1V over channel 4

			oscilloscope.setCoupling( 1, "DC");
			oscilloscope.setCoupling( 2, "AC");
			oscilloscope.setCoupling( 3, "AC");
			oscilloscope.setCoupling( 4, "DC");

			oscilloscope.setTriggerToChannel( "A", 1 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
			oscilloscope.setTriggerCoupling( "A", "DC" ); // Trigger coupling should be DC
			oscilloscope.setTriggerSlope("A", "DOWN"); // Trigger on bit going up
			oscilloscope.setTriggerLevel("A", 2); // Trigger on bit going up
			oscilloscope.setPreTrigger( "A", preTrigger ); // Set pre-trigger, 10%
			oscilloscope.setChannelOffset( 2, 0 );
			oscilloscope.setChannelOffset( 3, 0);


			keithley.command("exit()"); // Reset keithley


			oscilloscope.setChannelPosition( 3, -2.5 );
			oscilloscope.setChannelPosition( 2, -2.5 );

			oscilloscope.setTriggerLevel( "A", 0.7 ); // Set trigger to 0.7V
			var seed = 800;
			return new Promise( function( resolver, rejecter ) {

			self.oscilloscope.ready.then( function() {

				oscilloscope.setTriggerLevel("A", 1); // Trigger on bit going up

				function *pulse( ) {


						var l = 0;
						var voltage = 0;

						var minV = self.arduino.params.whiteLightLED.lowestSunLevel;
						var maxV = self.arduino.params.whiteLightLED.highestSunLevel;

				/*		var minV = 1900;
						var maxV = 1900;
*/

						afg.setShape( 1, "DC" );
						afg.setVoltageOffset( 1, 1.5 ); // Turn on red LEDs on channel on
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
								var high = 1500;

								// Set the pin LOW
								keithley.measureVoc( { channel: "smub", settlingTime: 2 } ).then( function( v ) {
									voltage = v;
									p.next();
								} );

								yield;
								while( true ) {
									afg.disableChannel( 1 );
									self.arduino.setColorLightLevelVoltage( seed );
									// Set the pin LOW
									keithley.measureIsc( { channel: "smub", settlingTime: 1 } ).then( function( v ) {
										jsc = v;
										p.next();
									} );

									yield;

									afg.enableChannel( 1 ); // Set the pin LOW

									keithley.measureIsc( { channel: "smub", settlingTime: 1 } ).then( function( jscPerturb ) {


										var diff = Math.abs( jscPerturb - jsc );
										console.log( jscPerturb, jsc, diff, diff * 50 * 1000 + "mV" );
										if(  diff * 50 > 2e-3 && diff * 50 < 10e-3 ) { // If perturbation is between 5 and 20%
											p.next( true );
											return;
										}

										if( diff * 50 > 10e-3 ) { // Too big

											var seed2 = (low + seed) / 2;
											high = seed;
											seed = seed2;

										} else if( diff * 50 < 2e-3 ) { // Too low

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


								arduinoV += 100;

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
						var dV, dQ;

						while( true ) {

							if( k == waveArduinoV.getDataLength() ) {
								break;
							}

							var voltage = waveArduinoV.get( k );
							var perturbation = waveArduinoVColor.get( k );

							self.arduino.setWhiteLightLevelVoltage( voltage );
							self.arduino.setColorLightLevelVoltage( perturbation );

							afg.enableChannel( 1 );

							keithley.applyVoltage( { channel: 'smub', bias: waveVoc.get( k ) } );
							oscilloscope.setAveraging( experiment.parameters.averaging );
							oscilloscope.setTimeBase( experiment.parameters.timebase );

							self.pulse( ).then( function( w ) {
								console.log("To subtract: " + w["2"].getAverageP( 450, 499 ) );
								w[ "2" ].subtract( w["2"].getAverageP( 450, 499 ) );
								dQ = w[ "2" ].integrateP( preTrigger / 100 * 500, 499 );

								self.progress("current", [ w["2" ] ]);


								if( ! self._paused ) {
									p.next();
								} else {
									self.paused();
								}

							});
							yield;

							afg.enableChannel( 2 );
							keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // Turn the output off
							keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off
							oscilloscope.setTimeBase( experiment.parameters.pulseTime );

							oscilloscope.setAveraging( experiment.parameters.averaging / 8 );
							oscilloscope.setTriggerSlope("A", "DOWN"); // Trigger on bit going up

							self.pulse( 1 / 8 ).then( function( w ) {

								dV = w["3"].get( preTrigger / 100 * 500 - 5 ) - w["3"].integrateP( 0, 50 );
								if( ! self._paused ) {
									p.next();
								} else {
									self.paused();
								}

							});
							yield;


							l++;

console.log( dV, dQ, dQ / dV );
							wavedV.push( dV );
							wavedQ.push( dQ );
							wavedC.push( dQ / dV );

							self.progress( "CV", [ waveVoc, wavedV, wavedQ, wavedC ] );

							if( voltage > 21700 ) {
								break;
							}

							k++;


					} // end while true

				//	resolver( [ waveVoc, wavedV, wavedQ, wavedC ] );
			} // end generator


			var p = pulse();
			p.next( );
			self.iterator = p;


			}); // End oscilloscope ready

		}); // End returned promise

	},

		pulse: function( timeFactor ) {

			timeFactor = timeFactor || 1;
			var self = experiment;

			return new Promise( function( resolver, rejecter ) {

				setTimeout( function() {

					return self.oscilloscope.getWaves().then( function( allWaves ) {

							setTimeout( function() {
								resolver( allWaves );
							}, 1000)


					});



				}, self.parameters.totalTime * timeFactor * 1000 );

			} );
		}
}


module.exports = experiment;
