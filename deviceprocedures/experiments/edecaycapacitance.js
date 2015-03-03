
var Waveform = require('../../server/waveform');
var _ = require('lodash');

var experiment = {

	init: function( parameters ) {

		experiment.parameters = parameters;

		experiment.oscilloscope = parameters.instruments["gould-oscilloscope"].instrument;
		experiment.keithley = parameters.instruments["keithley-smu"].instrument;
		experiment.arduino = parameters.instruments.arduino.instrument;

		experiment.parameters.ledPin = 4;
		experiment.parameters.switchPin = 5;
		experiment.parameters.pulseTime = 2;
		experiment.parameters.delay = 2;
		experiment.focus = false;

		experiment.parameters.lightIntensities = [ 0 ];
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

		var self = experiment;
		return new Promise( function( resolver, rejecter ) {

			var wavePulse = [];
			var waveVoltage = [];
			var waveCurrent = [];
			var waveSwitch = [];


			var waveVoc = [];
			var waveCapacitance = [];
			var waveCharges = [];
			var waveCapacitance2 = [];
			var waveCharges2 = [];

			var recordedWaves = [];

			var timeBases = [ 50e-6, 500e-6, 5000e-6, 50000e-6 ];
			var yScales = [ 5e-3, 5e-3, 5e-3, 5e-3 ];



			var timeBase;

			// Calculate delays
			var nbPoints = 35,
				b = ( Math.log( 30 / 20e-6 ) / Math.log( 10 ) ) / ( nbPoints - 1 ),
				a = 20e-6 / Math.pow( 10, ( b * 0 ) ),
				timeDelays = [];

			var timeBasePulsesEx = [];

			for( var i = 0; i < nbPoints; i += 1 ) {
				timeDelays.push( a * Math.pow( 10, b * i ) );

				timeBasePulsesEx.push( timeBases.slice( 0 ) );
			}

			var timeBasePulses = [];
			for( var i = 0; i < experiment.parameters.lightIntensities.length; i ++ ) {
				timeBasePulses[ i ] = _.cloneDeep( timeBasePulsesEx );
			}
			var blankWaves = [];


			// Oscilloscope functions

			var preTrigger = 10;

			self.oscilloscope.disableAveraging();

			self.oscilloscope.enable50Ohms( 2 );
			self.oscilloscope.disable50Ohms( 3 );

			self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

			self.oscilloscope.setVoltScale( 2, 2e-3 ); // 2mV over channel 2
			self.oscilloscope.setVoltScale( 3, 200e-3 ); // 200mV over channel 3
			self.oscilloscope.setVoltScale( 4, 1 ); // 1V over channel 4

			self.oscilloscope.setTriggerCoupling( "A", "AC" ); // Trigger coupling should be AC

			self.oscilloscope.setCoupling( 1, "DC");
			self.oscilloscope.setCoupling( 2, "DC");
			self.oscilloscope.setCoupling( 3, "DC");
			self.oscilloscope.setCoupling( 4, "DC");

			self.oscilloscope.setTriggerToChannel( "A", 4 ); // Set trigger on switch channel
			self.oscilloscope.setTriggerCoupling( "A", "AC" ); // Trigger coupling should be AC
			self.oscilloscope.setTriggerSlope("A", "UP"); // Trigger on bit going up
			self.oscilloscope.setPreTrigger( "A", preTrigger ); // Set pre-trigger, 10%

			self.oscilloscope.setChannelPosition( 2, -2.5 );
			self.oscilloscope.setChannelPosition( 3, -2.5 );

			self.keithley.command("exit()"); // Reset keithley
			self.keithley.command("*CLS"); // Reset keithley
			self.keithley.command("*RST"); // Reset keithley


			self.oscilloscope.setTriggerLevel( "A", 0.7 ); // Set trigger to 0.7V

			self.oscilloscope.ready.then( function() {




				function *pulse( totalDelays, totalPulseNb ) {

						var k = 0;
						var j = 0;
						var l;

						for( var n = 0; n < timeBases.length; n += 1 ) {

							timeBase = timeBases[ n ];

							self.pulseBlank( timeBase, yScales[ n ] ).then( function( w ) {
								blankWaves.push( w );
//console.log( w );
								if( ! self._paused ) {
									p.next();
								} else {
									self.paused();
								}
							});

							yield;
						}



						while( true ) {




							if( j %  20 == 0 ) {
								// Time to change the light
								l = (j / 20) % ( self.parameters.lightIntensities.length );
								self.arduino.setWhiteLightLevel( self.parameters.lightIntensities[ l ] );


								waveVoc[ l ] = waveVoc[ l ] || [];

								waveCapacitance[ l ] = waveCapacitance[ l ] || [];
								waveCharges[ l ] = waveCharges[ l ] || [];

								waveCapacitance2[ l ] = waveCapacitance2[ l ] || [];
								waveCharges2[ l ] = waveCharges2[ l ] || [];

							}

							j++;

							if( self.focus === false ) {

								// Randomize delay
								var i = Math.floor( Math.random() * ( timeBasePulses[ l ].length ) );

								// Safeguard
								if( k < 10000 ) {

									// If standard deviation is lower than 20% of the mean and there has been 8 shots, we're good
									if( waveCharges[ l ][ i ] &&  waveCharges[ l ][ i ].getDataLength() > 256 && waveCharges[ l ][ i ].stdDev() < waveCharges[ l ][ i ].mean() * 0.2 ) {
										k++;
										continue;
									}
								}

								k = 0;

							} else {
								var i = self.focus;
							}




							/*
								Integration concept
								- Two time scales to catch slow and fast component
								- Two timescales fixed
								- Charges is the sum of the two
								- Weighting time bases ?
							*/
console.log("__________________________");
							recordedWaves = [];

							var breakIt = false;
							for( var n = 0; n < timeBasePulses[ l ][ i ].length; n += 1 ) {
								timeBase = timeBases[ n ];
								breakIt = false;


								console.log( timeBasePulses, l );


								self.pulse( timeBasePulses[ l ][ i ][ n ], yScales[ timeBases.indexOf( timeBasePulses[ l ][ i ][ n ] ) ], timeDelays[ i ] ).then( function( w ) {

									w[ 2 ].subtract( blankWaves[ timeBases.indexOf( timeBasePulses[ l ][ i ][ n ] ) ] );
									recordedWaves.push( w );

									console.log( Math.abs( w[ 2 ].getAverageP( 400, 499 ) - w[ 2 ].getAverageP( 250, 300 ) ), w[ 2 ].getAverageP( 400, 499 ) );
									if( Math.abs( w[ 2 ].getAverageP( 400, 499 ) - w[ 2 ].getAverageP( 250, 300 ) ) < 0.01e-4 && w[ 2 ].getAverageP( 400, 499 ) < 0.03e-4 ) {
										console.log("Got all I need " + l + ", " + i + ", " + n );

										var sp = timeBasePulses[ l ][ i ].splice( n + 1 );
										if( sp.length > 0 ) {
											recordedWaves.splice( n + 1 );
											breakIt = true;
										}


										for( var u = i; u < timeBasePulses[ l ].length; u ++ ) {

											sp.map( function( sp1 ) {
												_.pull( timeBasePulses[ l ][ u ], sp1 );
											});


										}



									}

									if( ! self._paused ) {
										p.next();
									} else {
										self.paused();
									}

								});

								yield;

								if( breakIt ) {
									break;
								}
							}

							if( timeBasePulses[ l ][ i ].length >= 3 ) {
								while( timeBasePulses[ l ][ i ].length >= 3 ) {
									var el = timeBasePulses[ l ][ i ].shift();
									recordedWaves.shift();
									for( var u = 0; u < i; u ++ ) {
										var index;
										if( ( index = timeBasePulses[ l ][ u ].indexOf( el  ) ) > -1 ) {
											timeBasePulses[ l ][ u ].splice( index, 1 );
										}
									}
								}

							}

							// Look on the first voltage wave
							var level = recordedWaves[ 0 ][ "3" ].findLevel(0.05, {
								edge: 'descending',
								box: 1,
								rouding: 'before',
								rangeP: [ 30, 80 ]
							});

							if( recordedWaves.length >= 3 ) { // Let's keep two pulses max per el.
								console.log("Too many ! " + l + ", " + i );
								continue;
							}

							// We need to find some voltage !
							if( recordedWaves[ 0 ][ "3" ].get( 40 ) > 0.01 ) {

								// Do the waveform exists
								waveVoc[ l ][ i ] = waveVoc[ l ][ i ] || new Waveform();
								waveCharges[ l ][ i ] = waveCharges[ l ][ i ] || new Waveform();
								waveCapacitance[ l ][ i ] = waveCapacitance[ l ][ i ] || new Waveform();


								//var voc = recordedWaves[ 0 ][ "3" ].get( level - 2 );
								var voc = recordedWaves[ 0 ]["3"].get(48);
								var m = 0;
								var charges = 0;
								var fastestCharges;


								var baseLine = recordedWaves[ recordedWaves.length - 1 ][ 2 ].duplicate();
						//		baseLine.subtract( blankWaves[ recordedWaves.length - 1 ] );
								baseLine = baseLine.getAverageP( 400, 499 );

								console.log( baseLine );

								recordedWaves.map( function( w ) {

									// Total width: timeBaseSlow * 10 over n points
									// Exemple: 2000e-6 * 10 / 500 = 0.00004 s / pt
									// ( 20e-6 * 10 ) / 0.0004 = 5 pts to exclude

									var ptStart;
									ptStart = preTrigger / 100 * 500;

									w[ 2 ].subtract( baseLine );


									if( m > 0 ) {
										ptStart += Math.ceil( timeBases[ m - 1 ] * 500 / timeBases[ m ] );
									} else {
										fastestCharges = w[ "2" ].integrateP( ptStart, 499 );
									}

									charges += w[ "2" ].integrateP( ptStart, 499 );
									m++;
								});

								waveVoc[ l ][ i ].push( voc );
								waveCharges[ l ][ i ].push( charges );
								waveCapacitance[ l ][ i ].push( charges / voc );


								/*wavePulse[ i ].push( recordedWaves[ "1" ] );
								waveCurrent[ i ].push( allWaves[ "2" ] );
								waveVoltage[ i ].push( allWaves[ "3" ] );
								waveSwitch[ i ].push( allWaves[ "4" ] );
	*/

								self.progress( recordedWaves, j, timeDelays[ i ], self.parameters.lightIntensities[ l ], timeDelays, waveCharges, waveVoc, waveCapacitance );
							}

							// Safeguard
							if( j > 40000 ) {
								break;
							//	yield;
							}

						}

			//		}

					resolver( [ waveCurrent, waveVoltage ] );
				}

				var p = pulse( timeDelays.length, 8 );
				p.next( );
				self.iterator = p;


			}); // End oscilloscope ready

		}); // End returned promise

	},

		pulse: function( timeBase, yScale, delaySwitch ) {

			var self = experiment;
			self.oscilloscope.setTimeBase( timeBase );
			self.oscilloscope.setVoltScale( 2, yScale ); // 2mV over channel 2

			return self.keithley.pulseAndSwitchDiogio( {

				diodePin: self.parameters.ledPin,
				switchPin: self.parameters.switchPin,
				pulseWidth: self.parameters.pulseTime,
				numberOfPulses: 1,
				delayBetweenPulses: delaySwitch + 1,
				delaySwitch: delaySwitch

			} ).then( function( value ) {

				return self.oscilloscope.getWaves().then( function( allWaves ) {

					// Zeroing voltage wave
					var voltageWave = allWaves[ "3" ];
					voltageWave.multiply( 1 );
					voltageWave.subtract( voltageWave.average( 400, 499 ) );

					// Zeroing current wave
					var currentWave = allWaves[ "2" ];
					currentWave.multiply( 1 );
					currentWave.divide( 50 );
					currentWave.subtract( currentWave.average( 0, 40 ) );

					return allWaves;
				});
			});


		},


		pulseBlank: function( timeBase, yScale ) {

			var self = experiment;
			self.oscilloscope.setTimeBase( timeBase );
			self.oscilloscope.setVoltScale( 2, yScale ); // 2mV over channel 2
			self.oscilloscope.enableAveraging();

			function nearestPow2(n) {
				var m = n;
				for(var i = 0; m > 1; i++) {
					m = m >>> 1;
				}
				// Round to nearest power
				if (n & 1 << i-1) { i++; }
				return 1 << i;
			}

			timeBase = Math.max( timeBase, 1e-3 );
			var nbPulses = nearestPow2( 20 / ( timeBase * 40 ) / 2 )

			self.oscilloscope.setAveraging( nbPulses );

			return new Promise( function( resolver ) {

				setTimeout( function() {


					resolver( self.keithley.longPulse( {

						diodePin: 5,
						pulseWidth: timeBase * 15,
						numberOfPulses: nbPulses * 2,
						delay: timeBase * 15

					} ).then( function( value ) {

						return self.oscilloscope.getWaves().then( function( allWaves ) {

							// Zeroing current wave
							var currentWave = allWaves[ "2" ];
							currentWave.multiply( 1 );
							currentWave.divide( 50 );
							currentWave.subtract( currentWave.average( 0, 40 ) );
							self.oscilloscope.disableAveraging();

							return currentWave;


						});
					}) );


				}, 2000 )
			})



		}
}


module.exports = experiment;
