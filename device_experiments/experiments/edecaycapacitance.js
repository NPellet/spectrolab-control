
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
		this.parameters.pulseTime = 5;
		this.parameters.delay = 2;
	},

	setLEDPin: function() {

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

			var timeDelays = [];


			var b = ( Math.log( 1 / 10e-6 ) / Math.log( 10 ) ) / ( 59 - 0 ); 
			var a = 10e-6 / Math.pow( 10, ( b * 0 ) );

			for( var i = 0; i < 60; i += 1 ) {
				timeDelays.push( a * Math.pow( 10, b * i ) );
			}

			console.log( timeDelays );


			self.oscilloscope.disableAveraging();
			
			self.oscilloscope.setTimeBase( 500e-6 ); // 200us timeBase
			self.oscilloscope.enable50Ohms( 2 );
			self.oscilloscope.disable50Ohms( 3 );

			self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

			self.oscilloscope.setVoltScale( 2, 5e-3 ); // 2mV over channel 2
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
			self.oscilloscope.setPreTrigger( "A", 10 ); // Set pre-trigger, 10%

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

					var allvoltages = [];
					var allcapacitances = [];

					while( true ) {

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
						j++;

						console.log("Pulsing with time delay: " + timeDelays[ i ] + "; Iterator number : " + j );

						self.keithley.pulseAndSwitchDiogio( {
							
							diodePin: self.parameters.ledPin,
							switchPin: self.parameters.switchPin,
							pulseWidth: self.parameters.pulseTime,
							numberOfPulses: 1,
							delayBetweenPulses: self.parameters.delay,
							delaySwitch: timeDelays[ i ]

						} ).then( function( value ) {

							console.log('Pulse has ended');
							self.oscilloscope.getWaves().then( function( allWaves ) {


								var voltageWave = allWaves[ "3" ];
								voltageWave.subtract( voltageWave.average( 400, 499 ) );

								var level = voltageWave.findLevel(0.02, {
									edge: 'descending',
									box: 1,
									rouding: 'before',
									rangeP: [ 40, 60 ]
								});								

								var level = voltageWave.get( level - 3 );

								if( level ) {


									wavePulse[ i ] = wavePulse[ i ] || [];
									waveVoltage[ i ] = waveVoltage[ i ] || [];
									waveCurrent[ i ] = waveCurrent[ i ] || [];
									waveSwitch[ i ] = waveSwitch[ i ] || [];

									waveCharges[ i ] = waveCharges[ i ] || new Waveform();
									waveVoc[ i ] = waveVoc[ i ] || new Waveform();
									waveCapacitance[ i ] = waveCapacitance[ i ] || new Waveform();

									var charges = waveCharges[ i ];
									var voc = waveVoc[ i ];



									voc.push( level );
									var currentWave = allWaves[ "2" ];
									currentWave.multiply( -1 );
									currentWave.divide( 50 );

									currentWave.subtract( currentWave.average( 0, 40 ) );
									charges.push( currentWave.integrateP( 50, 499 ) );

									allWaves[ "2" ] = currentWave;

									wavePulse[ i ].push( allWaves[ "1" ] );
									waveCurrent[ i ].push( allWaves[ "2" ] );
									waveVoltage[ i ].push( allWaves[ "3" ] );
									waveSwitch[ i ].push( allWaves[ "4" ] );

									waveCapacitance[ i ].push( charges.get( charges.getDataLength()  - 1 ) / level );

									if( self.parameters.progress ) {
										self.parameters.progress( allWaves, timeDelays[ i ], wavePulse[ i ].length - 1, waveCharges, waveVoc, timeDelays, waveCapacitance );
									}


									console.log('Delay: ' + timeDelays[ i ] + '; Charges: ' + - currentWave.integrateP( 50, 499 ) + "; Voc: " + level )

								}
							


								p.next();
							});
						});						

						// Safeguard
						if( j < 10000 ) {
							yield;
						}

					}

					resolver( [ waveSwitch, waveCurrent, waveVoltage ] );
				}

				var p = pulse( timeDelays.length, 8 );
				p.next( );	
			});
		
		});
	}
}

module.exports = experiment;