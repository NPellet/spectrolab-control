
var Waveform = require('../../server/waveform');
var _ = require('lodash');

var experiment = {

	init: function( parameters ) {

		experiment.parameters = parameters;

		experiment.oscilloscope = parameters.instruments["tektronix-oscilloscope"].instrument;
		experiment.keithley = parameters.instruments["keithley-smu"].instrument;
		experiment.arduino = parameters.instruments.arduino.instrument;

		experiment.parameters.ledPin = 4;
		experiment.parameters.switchPin = 5;
		experiment.parameters.pulseTime = 0.01;
		experiment.parameters.delay = 2;
		experiment.focus = false;

		experiment.parameters.lightIntensities = [ 0 ];
		experiment.parameters.pulseTimes = [ 3 ];
	},


	focusOn: function( id ) {
		experiment.focus = id;
	},

	config: {

		pulses: function( val ) {

		},

		focus: function( focusid ) {
			experiment.focus = focusid;
		}
	},

	run: function() {

		var self = experiment;
		var keithley = experiment.keithley;
		keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance

		return new Promise( function( resolver, rejecter ) {

			var wavePulse = [];
			var waveVoltage = [];
			var waveCurrent = [];
			var waveSwitch = [];


			var waveVoc = [];
			var waveDelays = [];
			var waveCharges = [];

			var recordedWaves = [];

			var timeBase = 40e-6;
			var yScales = 40e-3;
			var yScales = 40e-3;
			var timeBase = 1000e-6;

			// Calculate delays
			var nbPoints = 30,
				b = ( Math.log( 15 / 10e-6 ) / Math.log( 10 ) ) / ( nbPoints - 1 ),
				a = 10e-6 / Math.pow( 10, ( b * 0 ) ),
				timeDelays = [];

			for( var i = 0; i < nbPoints; i += 1 ) {
				timeDelays.push( a * Math.pow( 10, b * i ) );
			}

			var blankWaves = [];
			var blankWavesV;
			// Oscilloscope functions

			var preTrigger = 10;
			var recordLength = 100000;

			//self.oscilloscope.disableAveraging();
			self.oscilloscope.stopAfterSequence( false );
			self.oscilloscope.enable50Ohms( 2 );
			self.oscilloscope.disable50Ohms( 3 );
			self.oscilloscope.disable50Ohms( 1 );
			self.oscilloscope.disable50Ohms( 4 );
			self.oscilloscope.setRecordLength( recordLength );
			self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

			self.keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off

			self.keithley.command( "exit()" ); // The off mode of the Keithley should be high impedance

			self.oscilloscope.setVerticalScale( 3, 150e-3 ); // 200mV over channel 3
			self.oscilloscope.setVerticalScale( 4, 1 ); // 1V over channel 4

			self.oscilloscope.setTriggerCoupling( "AC" ); // Trigger coupling should be AC

			self.oscilloscope.setCoupling( 1, "DC");
			self.oscilloscope.setCoupling( 2, "DC");
			self.oscilloscope.setCoupling( 3, "DC");
			self.oscilloscope.setCoupling( 4, "DC");

			self.oscilloscope.setTriggerToChannel( 4 ); // Set trigger on switch channel
			self.oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be AC
			self.oscilloscope.setTriggerSlope( 4, "RISE"); // Trigger on bit going up
			self.oscilloscope.setTriggerRefPoint( 10 ); // Set pre-trigger, 10%
			self.oscilloscope.setTriggerLevel( 0.7 ); // Set trigger to 0.7V

			self.oscilloscope.enableChannels();

			self.oscilloscope.setPosition( 2, -4 );
			self.oscilloscope.setPosition( 3, -4 );

			self.oscilloscope.setPosition( 1, 0 );
			self.oscilloscope.setPosition( 4, 0 );


			self.oscilloscope.setOffset( 1, 0 );
			self.oscilloscope.setOffset( 2, 0 );
			self.oscilloscope.setOffset( 3, 0 );
			self.oscilloscope.setOffset( 4, 0 );

			self.oscilloscope.enableAveraging();


			self.oscilloscope.ready().then( function() {
console.log("DONE");

				self.oscilloscope.setRecordLength( recordLength );
				self.oscilloscope.setHorizontalScale( timeBase );
				self.oscilloscope.setVerticalScale( 2, yScales ); // 2mV over channel 2

				function *pulse( totalDelays, totalPulseNb ) {

					var k = 0;
					var j = 0;
					var l;
/*
					self.arduino.setWhiteLightLevel( 0 );
					self.keithley.setDigioPin( 4, 1 );

					console.log( "Measuring IV ");
					self.keithley.sweepIV( { channel: 'smub', hysteresis: true, settlingTime: 0.5, nbPoints: 20, startV: 1.2, stopV: 0 }).then( function( iv ) {
						console.log( iv );
						self.progress( "iv", [ iv ] );
						console.log( "End IV" );
						self.keithley.setDigioPin( 4, 0 );

						p.next();
					});
					yield;
*/
					console.log('blank');
					self.pulseBlank( timeBase, yScales, recordLength ).then( function( w ) {
						blankWaves = w[ 0 ];
						blankWavesV = w[ 1 ];
//console.log( w );
						if( ! self._paused ) {
							p.next();
						} else {
							self.paused();
						}
					});

					yield;

					self.arduino.setWhiteLightLevel( 0 );



					while( true ) {

						if( j %  5 == 0 ) {
							// Time to change the light
							l = (j / 5) % ( self.parameters.pulseTimes.length );
			//				self.arduino.setWhiteLightLevel( self.parameters.lightIntensities[ l ] );

							self.parameters.pulseTime = self.parameters.pulseTimes[ l ];

							waveVoc[ l ] = waveVoc[ l ] || new Waveform();
							waveCharges[ l ] = waveCharges[ l ] || new Waveform();
							waveDelays[ l ] = waveDelays[ l ] || new Waveform();
						}

						j++;

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




						/*
							Integration concept
							- Two time scales to catch slow and fast component
							- Two timescales fixed
							- Charges is the sum of the two
							- Weighting time bases ?
						*/
						recordedWaves = [];

						var breakIt = false;

						breakIt = false;

						self.pulse( timeBase, yScales, timeDelays[ i ], recordLength ).then( function( w ) {

							w[ 2 ].subtract( blankWaves );
							w[ 3 ].subtract( blankWavesV );

							recordedWaves = w;

							if( ! self._paused ) {
								p.next();
							} else {
								self.paused();
							}
						});

						yield;



						recordedWaves[ "3" ].subtract( recordedWaves["3"].average( recordLength - 100, recordLength - 1 ) );

						// Look on the first voltage wave
						/*var level = recordedWaves[ "3" ].findLevel(0.05, {
							edge: 'descending',
							box: 1,
							rouding: 'before'
						});*/

					/*	if( recordedWaves.length >= 3 ) { // Let's keep two pulses max per el.
							console.log("Too many ! " + l + ", " + i );
							continue;
						}
*/
						// We need to find some voltage !
						if( recordedWaves[ "3" ].get( Math.round( recordLength * 0.09 ) ) > 0.01 ) {

							// Do the waveform exists


							//var voc = recordedWaves[ 0 ][ "3" ].get( level - 2 );
							var voc = recordedWaves[ "3" ].get( recordLength * 0.09 );
							var voc = recordedWaves[ "3" ].average( recordLength * 0.09, recordLength * 0.1 );

							var m = 0;
							var charges = 0;
							recordedWaves[ 2 ].subtract( recordedWaves[ 2 ].average( recordLength - 100, recordLength - 1 ) );

							charges = recordedWaves[ 2 ].integrateP( Math.round( 0.1 * recordLength ), recordLength - 1 );

							waveVoc[ l ].push( voc );
							waveCharges[ l ].push( charges );
							waveDelays[ l ].push( timeDelays[ i ] );

							Waveform.sort( waveVoc[ l ], [ waveVoc[ l ], waveCharges[ l ], waveDelays[ l ] ] );

							self.progress( "QV", [ recordedWaves, j, timeDelays[ i ], self.parameters.lightIntensities[ l ], timeDelays, waveCharges, waveVoc, waveDelays ] );

						} else {

							if( l == 0 ) {
								timeDelays.splice( i, timeDelays.length - i );
							}
						}

						// Safeguard
						if( j > 40000 ) {
							break;
						//	yield;
						}

					}

		//		}

				resolver( [ waveCurrent, waveVoltage ] );
				self.oscilloscope.disableChannels();
			}

			var p = pulse( timeDelays.length, 8 );
			p.next( );
			self.iterator = p;

			}); // End oscilloscope ready

		}); // End returned promise

	},

	pulse: function( timeBase, yScale, delaySwitch, recordLength ) {

		var self = experiment;

		nb = 2;
		if( delaySwitch > 1 ) {
			nb = 2;
		}
		self.oscilloscope.enableAveraging();

		self.oscilloscope.setNbAverage( nb );
		self.oscilloscope.clear();
//		self.oscilloscope.setHorizontalScale( timeBase );
//		self.oscilloscope.setVerticalScale( 2, yScale ); // 2mV over channel 2
		self.oscilloscope.startAquisition();

		return self.keithley.pulseAndSwitchDigio( {

			diodePin: self.parameters.ledPin,
			switchPin: self.parameters.switchPin,
			pulseWidth: self.parameters.pulseTime,
			numberOfPulses: nb,
			delayBetweenPulses: delaySwitch + 1,
			delaySwitch: delaySwitch

		} ).then( function( value ) {

			self.oscilloscope.stopAquisition();

			return self.oscilloscope.getWaves().then( function( allWaves ) {
				console.log( "Pulse done");
				// Zeroing voltage wave
				var voltageWave = allWaves[ "3" ];
				voltageWave.multiply( 1 );

				// Zeroing current wave
				var currentWave = allWaves[ "2" ];
				currentWave.multiply( 1 );
				currentWave.divide( 50 );
				currentWave.subtract( currentWave.average( 0, recordLength * 0.08 ) );

				var voltageWave = allWaves[ "3" ];
				voltageWave.subtract( currentWave.average( 0, recordLength * 0.08 ) );


				return allWaves;
			});
		});


	},


	pulseBlank: function( timeBase, yScale, recordLength ) {

			var self = experiment;

			function nearestPow2(n) {
				var m = n;
				for(var i = 0; m > 1; i++) {
					m = m >>> 1;
				}
				// Round to nearest power
				if (n & 1 << i-1) { i++; }
				return 1 << i;
			}

			var timeBase2 = Math.max( timeBase, 1e-2 );
			var nbPulses = nearestPow2( 20 / ( timeBase2 * 40 ) / 2 )

			self.oscilloscope.setNbAverage( nbPulses );
			//self.keithley.command("exit()"); // Reset keithley

			return new Promise( function( resolver ) {

				setTimeout( function() {


					resolver( self.keithley.longPulse( {

						diodePin: 5,
						pulseWidth: timeBase2 * 15,
						numberOfPulses: nbPulses * 2,
						delay: timeBase2 * 15

					} ).then( function( value ) {
console.log("LONG PULSE DONE");
						return self.oscilloscope.getWaves().then( function( allWaves ) {
							// Zeroing current wave
							var currentWave = allWaves[ "2" ];
							currentWave.multiply( 1 );
							currentWave.divide( 50 );
							currentWave.subtract( currentWave.average( 0, recordLength * 0.08 ) );
console.log("GOTTEN WAVES");
							return [ currentWave, allWaves["3"] ];
						});

					}) );


				}, 2000 )
			})



		}
}


module.exports = experiment;
