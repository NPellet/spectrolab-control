
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

		experiment.parameters.pulseTime = 3;
	},

	config: {

	},

	run: function() {

		var self = experiment;
		var keithley = experiment.keithley;

		var timeBase = 300e-6;
		var defaultYScale = 200e-3;
		var preTrigger = 10;
		var recordLength = 100000;

		return new Promise( function( resolver, rejecter ) {

			var yscales = {};

			// Oscilloscope functions

			self.oscilloscope.stopAfterSequence( false );

			self.oscilloscope.disable50Ohms( 2 );
			self.oscilloscope.enable50Ohms( 3 );
			self.oscilloscope.disable50Ohms( 1 );
			self.oscilloscope.disable50Ohms( 4 );
			self.oscilloscope.setRecordLength( recordLength );

			self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off
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

			oscilloscope.setMeasurementType( 1, "PK2PK" );
			oscilloscope.setMeasurementSource( 1, 2 );
			oscilloscope.enableMeasurement( 1 );

			self.oscilloscope.ready().then( function() {

				self.oscilloscope.setRecordLength( recordLength );

				function *pulse( totalDelays, totalPulseNb ) {

					var current;
					var lightLevel = 12;

					var results = {
						jscs: [],
						charges: [],
						lightLevels: []
					}

					while( true ) {

						self.arduino.setWhiteLightLevel( lightLevel );

						var yscale = yScales[ lightLevel ] || defaultYScale;
						var breakit = false;

						self.pulse( timeBase, yscale, recordLength ).then( function( w ) {

							self.oscilloscope.getMeasurement( 1 ).then( function( pk2pk ) {

									if( pk2pk < 2 * yscale ) {

										yscales[ lightLevel ] /= 2;
										breakit = true;
										current = w[ 3 ];
									}

									experiment.next();
							} );

						} );
						yield;

						if( breakit ) {
							continue;
						}

						self.pulseBlank( timeBase, yscale, recordLength ).then( function( w ) {

							current.subtract( w[ 3 ] );
							experiment.next();
						});
						yield;

						current.divide( 50 );

						var jsc = current.average( recordLength * 0.09, recordLength * 0.1 );
						var charges = current.integrateP( Math.round( 0.1 * recordLength ), recordLength - 1 );

						results.jscs.push( jsc );
						results.charges.push( charges );
						results.lightLevels.push( lightLevel );

						self.progress( "charge", results );

						if( lightLevel <= 0 ) {
							break;
						}

						lightLevel--;
					}

					self.oscilloscope.disableChannels();
				}

				var p = pulse( timeDelays.length, 8 );
				p.next( );
				self.iterator = p;

			}); // End oscilloscope ready

		}); // End returned promise

	},

	pulse: function( timeBase, yScale, recordLength ) {

		var self = experiment;

		nb = 8;
		if( delaySwitch > 1 ) {
			nb = 2;
		}

		self.oscilloscope.setNbAverage( nb );
		self.oscilloscope.clear();
		self.oscilloscope.setHorizontalScale( timeBase );
		self.oscilloscope.setVerticalScale( 2, yScale ); // 2mV over channel 2
		self.oscilloscope.startAquisition();
		self.oscilloscope.setTriggerMode("NORMAL");

		return self.keithley.longPulse( {

			diodePin: self.parameters.ledPin,
			pulseWidth: self.parameters.pulseTime,
			numberOfPulses: nb,
			delay: 1

		} ).then( function( value ) {

			self.oscilloscope.stopAquisition();

			return self.oscilloscope.getWaves().then( function( allWaves ) {
				return allWaves;
			});

		});

	},


	pulseBlank: function( timeBase, yScale, recordLength ) {

		var self = experiment;

		nb = 8;
		if( delaySwitch > 1 ) {
			nb = 2;
		}

		self.oscilloscope.setNbAverage( nb );
		self.oscilloscope.setTriggerMode("AUTO");
		self.oscilloscope.setHorizontalScale( timeBase );
		self.oscilloscope.setVerticalScale( 2, yScale ); // 2mV over channel 2
		self.oscilloscope.startAquisition();
		self.oscilloscope.clear();

		return new Promise( function( resolver ) {

			setTimeout( function() {
				self.oscilloscope.getWaves().then( function( allWaves ) {
					resolver( allWaves );
				});
			}, 10000 ); // 10 seconds for the blank

		});
	}
}


module.exports = experiment;
