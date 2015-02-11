
var Waveform = require('../../server/waveform');

var experiment = function() { };

experiment.prototype = {

	init: function( parameters ) {

		if( ! parameters.oscilloscope || ! parameters.keithley ) {
			throw "An oscilloscope and a keithley SMU are required";
		}

		this.parameters = parameters;

		this.oscilloscope = parameters.oscilloscope;
		this.keithley = parameters.keithley;

		this.parameters.ledPin = 4;
		this.parameters.switchPin = 5;
		this.parameters.pulseTime = 2;
		this.parameters.delay = 2;
		this.focus = false;
	},

	setLEDPin: function() {

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

			var waveCharges = [];
			var waveVoc = [];
			var waveCapacitance = [];

			var recordedWaves = [];

			var timeBases = [ 20e-6, 1000e-6 ];
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

					var j = 0;
					var k = 0;

					while( true ) {

						if( self.focus === false ) {

							// Randomize delay
							var i = Math.floor( Math.random() * ( timeDelays.length ) );

							// Safeguard
							if( k < 10000 ) {

								// If standard deviation is lower than 20% of the mean and there has been 8 shots, we're good
								if( waveCharges[ i ] &&  waveCharges[ i ].getDataLength() > 256 && waveCharges[ i ].stdDev() < waveCharges[ i ].mean() * 0.2 ) {
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
								console.log( recordedWaves );
								p.next();
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
							wavePulse[ i ] = wavePulse[ i ] || [];
							waveVoltage[ i ] = waveVoltage[ i ] || [];
							waveCurrent[ i ] = waveCurrent[ i ] || [];
							waveSwitch[ i ] = waveSwitch[ i ] || [];

							// Do the waveform exists
							waveCharges[ i ] = waveCharges[ i ] || new Waveform();
							waveVoc[ i ] = waveVoc[ i ] || new Waveform();
							waveCapacitance[ i ] = waveCapacitance[ i ] || new Waveform();



							var voc = recordedWaves[ 0 ][ "3" ].get( level - 2 );
							var m = 0;
							var charges = 0;

							recordedWaves.map( function( w ) {

								// Total width: timeBaseSlow * 10 over n points
								// Exemple: 2000e-6 * 10 / 500 = 0.00004 s / pt
								// ( 20e-6 * 10 ) / 0.0004 = 5 pts to exclude

								var ptStart;
								ptStart = preTrigger / 100 * 500;

								if( m > 0 ) {
									ptStart += timeBases[ m - 1 ] * 500 / timeBases[ m - 1 ]
								}

								charges += w[ "2" ].integrateP( ptStart, 499 );
								m++;
							});

							waveVoc[ i ].push( voc );
							waveCharges[ i ].push( charges );
							waveCapacitance[ i ].push( charges / voc );

							/*wavePulse[ i ].push( recordedWaves[ "1" ] );
							waveCurrent[ i ].push( allWaves[ "2" ] );
							waveVoltage[ i ].push( allWaves[ "3" ] );
							waveSwitch[ i ].push( allWaves[ "4" ] );
*/
							if( self.parameters.progress ) {
								self.parameters.progress( j, timeDelays[ i ], timeDelays, waveCharges, waveVoc, waveCapacitance );
							}
						}

						// Safeguard
						if( j > 10000 ) {
							break;
						//	yield;
						}

					}

					resolver( [ waveSwitch, waveCurrent, waveVoltage ] );
				}

				var p = pulse( timeDelays.length, 8 );
				p.next( );



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
