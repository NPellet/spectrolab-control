
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

		experiment.parameters.pulseTime = 1;
	},

	config: {

	},

	run: function() {

		var self = experiment;
		var keithley = experiment.keithley;
		var oscilloscope = experiment.oscilloscope;
		var arduino = experiment.arduino;

		var timeBase = 10000e-6;
		var defaultYScale = 2e-3;
		var preTrigger = 10;
		var recordLength = 100000;

		return new Promise( function( resolver, rejecter ) {

			var yscales = {};

			// Oscilloscope functions

			oscilloscope.stopAfterSequence( false );

			oscilloscope.disable50Ohms( 2 );
			oscilloscope.enable50Ohms( 3 );
			oscilloscope.disable50Ohms( 1 );
			oscilloscope.disable50Ohms( 4 );
			oscilloscope.setRecordLength( recordLength );

			self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off
			self.keithley.command( "exit()" ); // The off mode of the Keithley should be high impedance

			oscilloscope.setVerticalScale( 3, 150e-3 ); // 200mV over channel 3
			oscilloscope.setVerticalScale( 4, 1 ); // 1V over channel 4

			oscilloscope.setTriggerCoupling( "AC" ); // Trigger coupling should be AC

			oscilloscope.setCoupling( 1, "DC");
			oscilloscope.setCoupling( 2, "DC");
			oscilloscope.setCoupling( 3, "DC");
			oscilloscope.setCoupling( 4, "DC");

			oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel
			oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be AC
			oscilloscope.setTriggerSlope( 4, "FALL"); // Trigger on bit going up
			oscilloscope.setTriggerRefPoint( 10 ); // Set pre-trigger, 10%
			oscilloscope.setTriggerLevel( 0.7 ); // Set trigger to 0.7V

			oscilloscope.enableChannels();
	//		oscilloscope.disableChannel( 2 );
	//		oscilloscope.disableChannel( 4 );

			oscilloscope.setPosition( 2, -4 );
			oscilloscope.setPosition( 3, -4 );
			oscilloscope.setPosition( 1, 0 );
			oscilloscope.setPosition( 4, 0 );

			oscilloscope.setOffset( 1, 0 );
			oscilloscope.setOffset( 2, 0 );
			oscilloscope.setOffset( 3, 0 );
			oscilloscope.setOffset( 4, 0 );

			oscilloscope.enableAveraging();

			oscilloscope.disableCursors( );

			oscilloscope.setMeasurementType( 1, "PK2PK" );
			oscilloscope.setMeasurementSource( 1, 3 );
			oscilloscope.enableMeasurement( 1 );
			oscilloscope.setMeasurementGating( "OFF" );

			oscilloscope.ready().then( function() {

				oscilloscope.setRecordLength( recordLength );

				function *pulse( totalDelays, totalPulseNb ) {

					var current;
					var lightLevel = 8;

					var results = {
						jscs: [],
						charges: [],
						lightLevels: [],
						currentWaves: []
					}

					while( true ) {

						self.arduino.setWhiteLightLevel( lightLevel );

						yscales[ lightLevel ] = yscales[ lightLevel ] || defaultYScale;//( defaultYScale * arduino.getSunFromLevel( lightLevel ) / arduino.getSunFromLevel( 0 ) );
						var breakit = false;

						self.pulse( timeBase, yscales[ lightLevel ], recordLength ).then( function( w ) {

							oscilloscope.getMeasurementMean( 1 ).then( function( measurements ) {

								if( measurements[ 0 ] < 2 * yscales[ lightLevel ] && yscales[ lightLevel ] > 1e-3 ) {

										yscales[ lightLevel ] /= 2;
										breakit = true;

									} else {
										current = w[ 3 ];
									}

									experiment.next();
							} );

						} );
						yield;

						if( breakit ) {
							continue;
						}

						self.pulseBlank( timeBase, yscales[ lightLevel ], recordLength ).then( function( w ) {

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
						results.currentWaves.push( current );

						self.progress( "charge", results );

						if( lightLevel <= 0 ) {
							break;
						}

						lightLevel--;
					}

					oscilloscope.disableChannels();
				}

				var p = pulse( );
				p.next( );
				self.iterator = p;

			}); // End oscilloscope ready

		}); // End returned promise

	},

	pulse: function( timeBase, yScale, recordLength ) {

		var self = experiment;
		nb = 16;
		var oscilloscope = self.oscilloscope;

		oscilloscope.setNbAverage( nb );
		oscilloscope.clear();
		oscilloscope.setHorizontalScale( timeBase );
		oscilloscope.setVerticalScale( 3, yScale ); // 2mV over channel 2
		oscilloscope.startAquisition();
		oscilloscope.setTriggerMode("NORMAL");

		return self.keithley.longPulse( {

			diodePin: self.parameters.ledPin,
			pulseWidth: self.parameters.pulseTime,
			numberOfPulses: nb,
			delay: 1

		} ).then( function( value ) {

			oscilloscope.stopAquisition();

			return oscilloscope.getWaves().then( function( allWaves ) {
				return allWaves;
			});

		});

	},


	pulseBlank: function( timeBase, yScale, recordLength ) {

		var self = experiment;
		var oscilloscope = self.oscilloscope;
		nb = 128;

		oscilloscope.setNbAverage( nb );
		oscilloscope.setTriggerMode("AUTO");
		oscilloscope.setHorizontalScale( timeBase );
		oscilloscope.setVerticalScale( 3, yScale ); // 2mV over channel 2
		oscilloscope.clear();
		oscilloscope.startAquisition();

		return new Promise( function( resolver ) {

			setTimeout( function() {
				oscilloscope.getWaves().then( function( allWaves ) {
					resolver( allWaves );
				});
			}, 10000 ); // 10 seconds for the blank

		});
	}
}


module.exports = experiment;
