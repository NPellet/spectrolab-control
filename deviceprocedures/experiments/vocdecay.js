
var Waveform = require('../../server/waveform');

var experiment = {

	init: function( parameters ) {

		experiment.parameters = parameters;

		experiment.oscilloscope = parameters.instruments["tektronix-oscilloscope"].instrument;
		experiment.keithley = parameters.instruments["keithley-smu"].instrument;
		experiment.arduino = parameters.instruments.arduino.instrument;

		experiment.parameters.ledPin = 4;
		experiment.parameters.pulseTime = 10;
		experiment.parameters.delay = 15;

		experiment.lightIntensities = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ];
	},

	run: function() {

		var self = experiment;
		return new Promise( function( resolver, rejecter ) {

			var recordedWaves = [];
			var timeBase = 1000000e-6;
			var preTrigger = 0.1;
			var recordLength = 1000000;
			// Oscilloscope functions


			self.oscilloscope.disableAveraging();

			self.oscilloscope.enable50Ohms( 2 );
			self.oscilloscope.disable50Ohms( 3 );

			self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

			self.oscilloscope.setVerticalScale( 3, 200e-3 ); // 200mV over channel 3

			self.oscilloscope.setCoupling( 1, "DC");
			self.oscilloscope.setCoupling( 2, "GND");
			self.oscilloscope.setCoupling( 3, "DC");
			self.oscilloscope.setCoupling( 4, "GND");



			self.oscilloscope.stopAfterSequence( false );

			self.oscilloscope.setRecordLength( recordLength );

			self.oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel
			self.oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be AC
			self.oscilloscope.setTriggerSlope( 4, "FALL"); // Trigger on bit going up
			self.oscilloscope.setTriggerRefPoint( preTrigger * 100 ); // Set pre-trigger, 10%
			self.oscilloscope.setTriggerLevel( 0.7 ); // Set trigger to 0.7V
			self.oscilloscope.setHorizontalScale( timeBase );

			self.oscilloscope.setRecordLength( recordLength );
			self.oscilloscope.setPosition( 3, -4 );

				var vocDecays = [];
				function *pulse( ) {

					for( var i = 0; i < self.lightIntensities.length; i += 1 ) {

						var recordedWave;

						self.arduino.setWhiteLightLevel( self.lightIntensities[ i ] );
						self.oscilloscope.clear();
						self.oscilloscope.ready().then( function() {
							p.next();
						});
						yield;

						setTimeout( function() { p.next(); }, 2000 );
						yield;

						self.pulse( timeBase, 1 ).then( function( w ) {

							recordedWave = w;

							if( ! experiment._paused ) {
									p.next();
							} else {
								experiment.paused();
							}

						});


						yield;
						recordedWave = recordedWave.subset( ( recordLength - 1 ) * preTrigger, recordLength - 1 );
						recordedWave = recordedWave.degradeExp( 1000, 0.05 );
						recordedWave.shiftXToMin( 1e-6 );


						vocDecays[ i ] = recordedWave

						experiment.progress( vocDecays, self.lightIntensities );


					}

					experiment.done( vocDecays, self.lightIntensities );
				}

				var p = pulse();
				experiment.iterator = p;
				p.next( );


		}); // End returned promise

	},

	pulse: function( timeBase, number, delay ) {

		var self = experiment;

		return self.keithley.longPulse( {

			diodePin: self.parameters.ledPin,
			pulseWidth: self.parameters.pulseTime,
			numberOfPulses: number || 1,
			delay: delay || self.parameters.delay

		} ).then( function( value ) {

			return self.oscilloscope.getWaves().then( function( allWaves ) {

				var voltageWave = allWaves[ "3" ];
				console.log('done');
				return voltageWave;
			});
		});


	}
}

module.exports = experiment;
