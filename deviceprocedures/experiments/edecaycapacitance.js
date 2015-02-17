
var Waveform = require('../../server/waveform');


var experiment = {

	init: function( parameters ) {


		this.parameters = parameters;

		this.oscilloscope = parameters.instruments["gould-oscilloscope"];
		this.keithley = parameters.instruments["keithley-smu"];
		this.arduino = parameters.instrumentsarduino;

		this.parameters.ledPin = 4;
		this.parameters.switchPin = 5;
		this.parameters.pulseTime = 2;
		this.parameters.delay = 2;
		this.focus = false;

		this.parameters.lightIntensities = [ 3, 5, 0, 8 ];
	},


	focusOn: function( id ) {
		this.focus = id;
	},


	run: function() {

		var self = this;
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

			var timeBases = [ 20e-6, 200e-6 ];
			var yScales = [ 10e-3, 2e-3 ];

			var timeBase;

			// Calculate delays
			var nbPoints = 35,
				b = ( Math.log( 1 / 10e-6 ) / Math.log( 10 ) ) / ( nbPoints - 1 ),
				a = 10e-6 / Math.pow( 10, ( b * 0 ) ),
				timeDelays = [];

			for( var i = 0; i < nbPoints; i += 1 ) {
				timeDelays.push( a * Math.pow( 10, b * i ) );
			}


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

			self.oscilloscope.setChannelPosition( 2, 2.5 );
			self.oscilloscope.setChannelPosition( 3, -2 );

			self.keithley.command("reset()"); // Reset keithley
			self.keithley.command("*CLS"); // Reset keithley
			self.keithley.command("*RST"); // Reset keithley


			self.oscilloscope.setTriggerLevel( "A", 0.7 ); // Set trigger to 0.7V


			self.oscilloscope.ready.then( function() {

				function *pulse( totalDelays, totalPulseNb ) {

					var k = 0;

					for( var l = 0; l < self.parameters.lightIntensities.length; l += 1 ) {

				//		var l = Math.floor( Math.random() * ( self.parameters.lightIntensities.length ) );

						var j = 0;
					
						self.arduino.setWhiteLightLevel( self.parameters.lightIntensities[ l ] );

						waveVoc[ l ] = [];

						waveCapacitance[ l ] = [];
						waveCharges[ l ] = [];	

						waveCapacitance2[ l ] = [];
						waveCharges2[ l ] = [];	
						
						while( true ) {

							if( self.focus === false ) {

								// Randomize delay
								var i = Math.floor( Math.random() * ( timeDelays.length ) );

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


							j++;
							/*
								Integration concept
								- Two time scales to catch slow and fast component
								- Two timescales fixed
								- Charges is the sum of the two
								- Weighting time bases ?
							*/

							recordedWaves = [];

							for( var n = 0; n < timeBases.length; n += 1 ) {
								timeBase = timeBases[ n ];
								self.pulse( timeBase, yScales[ n ], timeDelays[ i ] ).then( function( w ) {
									recordedWaves.push( w );

									if( ! self.paused ) {
										p.next();
									}
								});

								yield;
							}

							// Look on the first voltage wave
							var level = recordedWaves[ 0 ][ "3" ].findLevel(0.02, {
								edge: 'descending',
								box: 1,
								rouding: 'before',
								rangeP: [ 40, 60 ]
							});


							// We need to find some voltage !
							if( level ) {

								// Do the array exist ?
								/*wavePulse[ i ] = wavePulse[ i ] || [];
								waveVoltage[ i ] = waveVoltage[ i ] || [];
								waveCurrent[ i ] = waveCurrent[ i ] || [];
								waveSwitch[ i ] = waveSwitch[ i ] || [];
*/
								// Do the waveform exists
								waveVoc[ l ][ i ] = waveVoc[ l ][ i ] || new Waveform();
								waveCharges[ l ][ i ] = waveCharges[ l ][ i ] || new Waveform();
								waveCapacitance[ l ][ i ] = waveCapacitance[ l ][ i ] || new Waveform();

								waveCharges2[ l ][ i ] = waveCharges2[ l ][ i ] || new Waveform();
								waveCapacitance2[ l ][ i ] = waveCapacitance2[ l ][ i ] || new Waveform();



								var voc = recordedWaves[ 0 ][ "3" ].get( level - 2 );
								var m = 0;
								var charges = 0;
								var fastestCharges;

								recordedWaves.map( function( w ) {

									// Total width: timeBaseSlow * 10 over n points
									// Exemple: 2000e-6 * 10 / 500 = 0.00004 s / pt
									// ( 20e-6 * 10 ) / 0.0004 = 5 pts to exclude

									var ptStart;
									ptStart = preTrigger / 100 * 500;

									if( m > 0 ) {
										ptStart += timeBases[ m - 1 ] * 500 / timeBases[ m ]
									} else {
										fastestCharges = w[ "2" ].integrateP( ptStart, 499 );
									}

									charges += w[ "2" ].integrateP( ptStart, 499 );
									m++;
								});

								waveVoc[ l ][ i ].push( voc );
								waveCharges[ l ][ i ].push( charges );
								waveCapacitance[ l ][ i ].push( charges / voc );

								waveCharges2[ l ][ i ].push( fastestCharges );
								waveCapacitance2[ l ][ i ].push( fastestCharges / voc );

								/*wavePulse[ i ].push( recordedWaves[ "1" ] );
								waveCurrent[ i ].push( allWaves[ "2" ] );
								waveVoltage[ i ].push( allWaves[ "3" ] );
								waveSwitch[ i ].push( allWaves[ "4" ] );
	*/
								
								self.progress( j, timeDelays[ i ], self.parameters.lightIntensities[ l ], timeDelays, waveCharges, waveVoc, waveCapacitance, waveCharges2, waveCapacitance2 );
							}

							// Safeguard
							if( j > 400 ) {
								break;
							//	yield;
							}

						}

					}

					resolver( [ waveCurrent, waveVoltage ] );
				}

				var p = pulse( timeDelays.length, 8 );

				p.next( );
				self.iterator = p;


			}); // End oscilloscope ready

		}); // End returned promise

	},

	pulse: function( timeBase, yScale, delaySwitch ) {

		var self = this;
		self.oscilloscope.setTimeBase( timeBase );
		self.oscilloscope.setVoltScale( 2, yScale ); // 2mV over channel 2

		return self.keithley.pulseAndSwitchDiogio( {

			diodePin: self.parameters.ledPin,
			switchPin: self.parameters.switchPin,
			pulseWidth: self.parameters.pulseTime,
			numberOfPulses: 1,
			delayBetweenPulses: self.parameters.delay,
			delaySwitch: delaySwitch

		} ).then( function( value ) {

			return self.oscilloscope.getWaves().then( function( allWaves ) {

				// Zeroing voltage wave
				var voltageWave = allWaves[ "3" ];
				voltageWave.subtract( voltageWave.average( 400, 499 ) );

				// Zeroing current wave
				var currentWave = allWaves[ "2" ];
				currentWave.multiply( -1 );
				currentWave.divide( 50 );
				currentWave.subtract( currentWave.average( 0, 40 ) );

				return allWaves;
			});
		});


	}
}


module.exports = experiment;
