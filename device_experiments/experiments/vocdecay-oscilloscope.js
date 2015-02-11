
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
		this.parameters.pulseTime = 2;
	},

	run: function() {

		var self = this;
		return new Promise( function( resolver, rejecter ) {


			var recordedWaves = [];
			var vocDecay = new Waveform();

			// Oscilloscope functions

			var preTrigger = 10;

			self.oscilloscope.disableAveraging();

			self.oscilloscope.enable50Ohms( 2 );
			self.oscilloscope.disable50Ohms( 3 );

			self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

			self.oscilloscope.setVoltScale( 3, 200e-3 ); // 200mV over channel 3

			self.oscilloscope.setCoupling( 1, "DC");
			self.oscilloscope.setCoupling( 2, "GND");
			self.oscilloscope.setCoupling( 3, "DC");
			self.oscilloscope.setCoupling( 4, "GND");

			self.oscilloscope.setTriggerToChannel( "A", 1 ); // Set trigger on light control
			self.oscilloscope.setTriggerCoupling( "A", "AC" ); // Trigger coupling should be AC
			self.oscilloscope.setTriggerSlope("A", "DOWN"); // Trigger on bit going up
			self.oscilloscope.setPreTrigger( "A", preTrigger ); // Set pre-trigger, 10%

			self.oscilloscope.setChannelPosition( 2, 2.5 );
			self.oscilloscope.setChannelPosition( 3, -2 );

			self.keithley.command("reset()"); // Reset keithley
			self.keithley.command("*CLS"); // Reset keithley
			self.keithley.command("*RST"); // Reset keithley

			self.oscilloscope.setTriggerLevel( "A", 1 ); // Set trigger to 0.7V


			self.oscilloscope.ready.then( function() {

				function *pulse( totalDelays, totalPulseNb ) {

					recordedWaves = [];

					for( var n = 0; n < timeBases.length; n += 1 ) {
						timeBase = timeBases[ n ];
						self.pulse( timeBase, timeDelays[ i ] ).then( function( w ) {
							recordedWaves.push( w );
							console.log( recordedWaves );
							p.next();
						});

						yield;
					}

					recordedWaves.map( function( w ) {

						// Total width: timeBaseSlow * 10 over n points
						// Exemple: 2000e-6 * 10 / 500 = 0.00004 s / pt
						// ( 20e-6 * 10 ) / 0.0004 = 5 pts to exclude

						var ptStart;
						ptStart = preTrigger / 100 * 500;

						if( m > 0 ) {
							ptStart += timeBases[ m - 1 ] * 500 / timeBases[ m - 1 ]
						}

						var sub = w.subset( ptStart, 499 )
						vocDecay.push( sub );
						m++;

					} );

					resolver( vocDecay );
				}

				var p = pulse( timeDelays.length, 8 );
				p.next( );

			}); // End oscilloscope ready

		}); // End returned promise

	},

	pulse: function( timeBase, delaySwitch ) {

		var self = this;
		self.oscilloscope.setTimeBase( timeBase );

		return self.keithley.pulse( {

			diodePin: self.parameters.ledPin,
			pulseWidth: self.parameters.pulseTime,
			numberOfPulses: 1,
			delay: self.parameters.delay

		} ).then( function( value ) {

			return self.oscilloscope.getWaves().then( function( allWaves ) {

				var voltageWave = allWaves[ "3" ];
				return voltageWave;
			});
		});


	}
}

module.exports = experiment;
