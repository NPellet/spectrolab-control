
var Waveform = require('../../server/waveform');

var experiment = function() { };

experiment.prototype = {

	init: function( parameters ) {

		if( ! parameters.oscilloscope || ! parameters.keithley || ! parameters.arduino ) {
			throw "An oscilloscope, a keithley SMU and an Arduino with analog output are required";
		}

		this.parameters = parameters;

		this.oscilloscope = parameters.oscilloscope;
		this.keithley = parameters.keithley;
		this.arduino = parameters.arduino;

		this.parameters.ledPin = 4;
		this.parameters.pulseTime = 2;
		this.parameters.delay = 15;

		this.lightIntensities = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ];
	},

	run: function() {

		var self = this;
		return new Promise( function( resolver, rejecter ) {


			var recordedWaves = [];
			

			var timeBases = [
				10e-6,
				100e-6,
				1000e-6,
				10000e-6,
				100000e-6,
				1000000e-6
			];

			// Oscilloscope functions


			var preTrigger = 10;

			var baseLine;

			self.oscilloscope.disableAveraging();

			self.oscilloscope.enable50Ohms( 2 );
			self.oscilloscope.disable50Ohms( 3 );

			self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

			self.oscilloscope.setVoltScale( 3, 200e-3 ); // 200mV over channel 3
			self.oscilloscope.setVoltScale( 1, 1 ); // 200mV over channel 3

			self.oscilloscope.setCoupling( 1, "DC");
			self.oscilloscope.setCoupling( 2, "GND");
			self.oscilloscope.setCoupling( 3, "DC");
			self.oscilloscope.setCoupling( 4, "GND");

			
			self.oscilloscope.setTriggerLevel( "A", 1 ); // Set trigger to 0.7V
			self.oscilloscope.setTriggerToChannel( "A", 1 ); // Set trigger on light control
			self.oscilloscope.setTriggerCoupling( "A", "DC" ); // Trigger coupling should be AC
			self.oscilloscope.setTriggerSlope("A", "DOWN"); // Trigger on bit going up
			self.oscilloscope.setPreTrigger( "A", preTrigger ); // Set pre-trigger, 10%
			self.oscilloscope.setTriggerLevel( "A", 1 ); // Set trigger to 0.7V

			self.oscilloscope.setChannelPosition( 2, 2.5 );
			self.oscilloscope.setChannelPosition( 3, -2 );

			self.keithley.command("reset()"); // Reset keithley
			self.keithley.command("*CLS"); // Reset keithley
			self.keithley.command("*RST"); // Reset keithley

			


			self.oscilloscope.ready.then( function() {

				function *pulse( ) {

					var vocDecays = [];


					for( var i = 0; i < self.lightIntensities.length; i += 1 ) {

						var vocDecay = new Waveform();
						vocDecay.setXWave();
						recordedWaves = [];

						self.arduino.setWhiteLightLevel( self.lightIntensities[ i ] );

						self.oscilloscope.setTriggerSlope("A", "UP"); // Trigger on bit going up
						self.oscilloscope.setPreTrigger( "A", 50 ); // Set pre-trigger, 10%
						
						self.oscilloscope.ready.then( function() {

							self.pulse( 0.1, 2 ).then( function( w ) {
								baseLine = w.average( 0, 100 );
								p.next();
							});								
						});
						
						yield;

						self.oscilloscope.setTriggerSlope("A", "DOWN"); // Trigger on bit going up
						self.oscilloscope.setPreTrigger( "A", preTrigger ); // Set pre-trigger, 10%
				
						for( var n = 0; n < timeBases.length; n += 1 ) {
							timeBase = timeBases[ n ];
							self.pulse( timeBase ).then( function( w ) {
								recordedWaves.push( w );
								p.next();
							});

							yield;
						}

						var m = 0;
						var lastVal = 0;

						recordedWaves.map( function( w ) {

							// Total width: timeBaseSlow * 10 over n points
							// Exemple: 2000e-6 * 10 / 500 = 0.00004 s / pt
							// ( 20e-6 * 10 ) / 0.0004 = 5 pts to exclude

							var ptStart;
							ptStart = preTrigger / 100 * 500;


							if( m > 0 ) {
								ptStart += timeBases[ m - 1 ] * 500 / timeBases[ m ];
							}

							var sub = w.subset( Math.floor( ptStart ), 500 )
							sub.shiftX( - sub.getXFromIndex( 0 ) );
							sub.shiftX( lastVal );

							lastVal = timeBases[ m ] * 9;
							vocDecay.push( sub );
							m++;

						} );

						vocDecay.shiftX( timeBases[ 0 ] * 10 / 500 );
						vocDecay.subtract( baseLine );

						vocDecays[ i ] = vocDecay

						if( self.parameters.progress ) {
							self.parameters.progress( [ vocDecays, self.lightIntensities ] );
						}

					}

					resolver( [ vocDecays, self.lightIntensities ] );
				}

				var p = pulse();
				p.next( );

			}); // End oscilloscope ready

		}); // End returned promise

	},

	pulse: function( timeBase, number ) {

		var self = this;
		self.oscilloscope.setTimeBase( timeBase );

		return self.keithley.longPulse( {

			diodePin: self.parameters.ledPin,
			pulseWidth: self.parameters.pulseTime,
			numberOfPulses: number || 1,
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