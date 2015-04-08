
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

		var timeBase = 10000e-6;
		var defaultYScale = 10e-3;
		var preTrigger = 10;
		var recordLength = 100000;

		return new Promise( function( resolver, rejecter ) {

			var yscales = {};

			// Oscilloscope functions

			oscilloscope.stopAfterSequence( false );

			oscilloscope.enable50Ohms( 2 );
			oscilloscope.disable50Ohms( 3 );
			oscilloscope.disable50Ohms( 1 );
			oscilloscope.disable50Ohms( 4 );
			oscilloscope.setRecordLength( recordLength );
			oscilloscope.setTriggerMode("NORMAL");

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

			oscilloscope.setTriggerToChannel( 4 ); // Set trigger on switch channel
			oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be AC
			oscilloscope.setTriggerSlope( 4, "RISE"); // Trigger on bit going up
			oscilloscope.setTriggerRefPoint( 10 ); // Set pre-trigger, 10%
			oscilloscope.setTriggerLevel( 0.7 ); // Set trigger to 0.7V

			oscilloscope.enableChannels();

			oscilloscope.setPosition( 2, -4 );
			oscilloscope.setPosition( 3, -4 );

			oscilloscope.setPosition( 1, 0 );
			oscilloscope.setPosition( 4, 0 );

			oscilloscope.setOffset( 1, 0 );
			oscilloscope.setOffset( 2, 0 );
			oscilloscope.setOffset( 3, 0 );
			oscilloscope.setOffset( 4, 0 );

			oscilloscope.enableAveraging();

			oscilloscope.setCursors( "VBArs" );
			oscilloscope.setCursorsMode( "INDependent" );
			oscilloscope.setCursorsSource( 2 );
			oscilloscope.enableCursors( 2 );
			oscilloscope.setVCursorsPosition( 2, timeBase * 8 );
			oscilloscope.setVCursorsPosition( 1, 200e-9 ); // 5%


			oscilloscope.setMeasurementType( 1, "PK2PK" );
			oscilloscope.setMeasurementSource( 1, 2 );
			oscilloscope.enableMeasurement( 1 );
			oscilloscope.setMeasurementGating( "CURSOR" );

			oscilloscope.setMeasurementType( 2, "MINImum" );
			oscilloscope.setMeasurementSource( 2, 2 );
			oscilloscope.enableMeasurement( 2 );

			oscilloscope.ready().then( function() {

				oscilloscope.setRecordLength( recordLength );

				function *pulse( totalDelays, totalPulseNb ) {

					var lightLevel = 0;

					var results = {
						vocs: [],
						charges: [],
						lightLevels: [],
						currentWaves: [],
						voltageWaves: []
					};

					var current, voltage;

					while( true ) {

						self.arduino.setWhiteLightLevel( lightLevel );
						yscales[ lightLevel ] = yscales[ lightLevel ] || defaultYScale;
						var breakit = false;

						self.pulse( timeBase, yscales[ lightLevel ], recordLength ).then( function( w ) {

							oscilloscope.getMeasurementMean( 1, 2 ).then( function( measurements ) {

									if( measurements[ 0 ] < 2 * yscales[ lightLevel ] && yscales[ lightLevel ] > 1e-3 ) {
										oscilloscope.setOffset( 2, measurements[ 1 ] );

										yscales[ lightLevel ] /= 2;
										breakit = true;

									} else {
										current = w[ 2 ];
										voltage = w[ 3 ];
									}

									experiment.next();
							} );

						} );
						yield;

						if( breakit ) {
							continue;
						}

						self.pulseBlank( timeBase, yscales[ lightLevel ], recordLength ).then( function( w ) {

							current.subtract( w[ 2 ] );
							voltage.subtract( w[ 3 ] );
							experiment.next();
						});
						yield;

						current.divide( 50 );

						var voc = voltage.average( recordLength * 0.05, recordLength * 0.09 );
						var charges = current.integrateP( Math.round( 0.1 * recordLength ), recordLength - 1 );

						results.vocs.push( voc );
						results.charges.push( charges );
						results.lightLevels.push( lightLevel );
						results.currentWaves.push( current );
						results.voltageWaves.push( voltage );

						self.progress( "charge", results );

						oscilloscope.setOffset( 2, 0 );


						if( lightLevel >= 12 ) {
							break;
						}
						lightLevel++;
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


		var nb = 8;
		var oscilloscope = experiment.oscilloscope;

		oscilloscope.setNbAverage( nb );
		oscilloscope.clear();
		oscilloscope.setHorizontalScale( timeBase );
		oscilloscope.setVerticalScale( 2, yScale ); // 2mV over channel 2
		oscilloscope.startAquisition();

		return experiment.keithley.pulseAndSwitchDigio( {

			diodePin: experiment.parameters.ledPin,
			switchPin: experiment.parameters.switchPin,
			pulseWidth: experiment.parameters.pulseTime,
			numberOfPulses: nb,
			delayBetweenPulses: 1,
			delaySwitch: 0

		} ).then( function( value ) {

			oscilloscope.stopAquisition();
			return oscilloscope.getWaves();
		});
	},


	pulseBlank: function( timeBase, yScale, recordLength ) {

			var self = experiment;
			var oscilloscope = self.oscilloscope;
			oscilloscope.setHorizontalScale( timeBase );
			oscilloscope.setVerticalScale( 2, yScale ); // 2mV over channel 2
			oscilloscope.clear();
			oscilloscope.startAquisition();


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

			oscilloscope.setNbAverage( nbPulses );
			//self.keithley.command("exit()"); // Reset keithley

			return new Promise( function( resolver ) {

				setTimeout( function() {
					self.keithley.longPulse( {

						diodePin: 5,
						pulseWidth: timeBase2 * 15,
						numberOfPulses: nbPulses * 2,
						delay: timeBase2 * 15

					} ).then( function( ) {
						oscilloscope.getWaves().then( function( w ) {
							resolver( w );
						});
					});


				}, 5000 );

			});
		}
}


module.exports = experiment;
