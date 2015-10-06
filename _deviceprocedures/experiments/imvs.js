
var Waveform = require('../../server/waveform');
var _ = require('lodash');
var extend = require('extend');

var experiment = {

	// Experiment idea
	// AFG is used to send light pulses. We should use colored diodes as they can flash a lot faster
	// Diodes are on channel 1, transistor is on channel 2.
	// As channel 1 is switched to LOW, the channel 2 is switched to HIGH, thereby shortcircuiting the device.
	// The Jsc decay is recorded on the scope. We can only put the jsc is DC mode as during the pulse, the device is a Voc (not Jsc !). Anyway AC or DC should be irrelevant and yield the same, as the device has 0mA during the pulse.
	// If the pre-pulse is available on Channel 3, we can leave channel 3 on AC mode. We cannot trust the decay as it will drop to 0.

	init: function( parameters ) {

		experiment.parameters = parameters;

		experiment.arduino = parameters.instruments["arduino"].instrument;
		experiment.oscilloscope = parameters.instruments["tektronix-oscilloscope"].instrument;
		experiment.afg = parameters.instruments["tektronix-functiongenerator"].instrument;
		experiment.keithley = parameters.instruments["keithley-smu"].instrument;

		experiment.parameters.defaultAveraging = 128;
	},


	focusOn: function( id ) {
		experiment.focus = id;
	},

	makeIV: function( options ) {

		return experiment.keithley.sweepIV( extend( {
			channel: 'smub',
			startV: 1,
			stopV: 0,
			settlingTime: 0.1,
			timeDelay: 2,
			complianceI: 1,
			nbPoints: 50,
			hysteresis: 0
		}, ( options || {} ) ) );
	},


	config: {

		pulses: function( val ) {
			var timeBases = [];
			var voltScales = [];
			val.map( function( v ) {

				timeBases.push( v.timebase );
				voltScales.push( v.voltscale );
			});

			experiment.timeBases = timeBases;
			experiment.yScales = voltScales;
		},

		focus: function( focusid ) {
			experiment.focus = focusid;
		}
	},

	run: function() {

			var coupling = "AC";
			var afg = experiment.afg;
			var arduino = experiment.arduino;
			var keithley = experiment.keithley;
			var oscilloscope = experiment.oscilloscope;

			var self = experiment;
			var preTrigger = 30;

			var impsimvs = 'imvs';

			/* AFG SETUP */
			var min = 2.1;
			var max = 2.8;

			arduino.setWhiteLightLevel( 2 );

			afg.disableChannels( ); // Set the pin LOW
			afg.getErrors();

			keithley.setDigioPin( 4, 1 );

			oscilloscope.enable50Ohms( 1 ); // LED is on current
			oscilloscope.disable50Ohms( 3 ); // Cell is on voltage

			oscilloscope.setVerticalScale( 1, 500e-3 ); // 20mV over channel 3
			oscilloscope.setVerticalScale( 3, 0.67e-3 ); // 20mV over channel 3

			oscilloscope.setCoupling( 1, "DC");
			oscilloscope.setCoupling( 3, "DC");

			oscilloscope.setTriggerToChannel( "1" ); // Set trigger on switch channel. Can also use down trigger from Channel 1
			oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
			oscilloscope.setTriggerSlope( 1, "RISE"); // Trigger on bit going up
			oscilloscope.setTriggerLevel( 1.46 ); // Trigger on bit going up

			oscilloscope.setPosition( 3, 0 );
			oscilloscope.setPosition( 2, 0 );

			oscilloscope.setOffset( 3, 0 );
			oscilloscope.setOffset( 2, 0 );




			// Calculate delays
			var nbPoints = 90;

			var x1 = 1;
			var x2 = nbPoints;
			var y1 = 0.1; // 7 MHz
			var y2 = 5e6; // 0.1 Hz

			// y1 = a exp( - x1 * b )
			// y2 = a exp( - x2 * b )

			//y1 / y2 = exp( b ( x2 - x1 ) )

			//y1 - y2 = a ln( x1 / x2 );

			var b = Math.log( y1 / y2 ) / ( x2 - x1 );
			var a = y1 / Math.pow( 2.71828, - x1 * b );

			var frequencies = [];

			for( var i = x1; i <= x2 ; i += 1) {
				frequencies.push( Math.round( a * Math.exp( - b * i )  * 100 ) / 100 );
			}

			return new Promise( function( resolver, rejecter ) {

				oscilloscope.ready().then( function() {


					function *pulse( ) {

						afg.setShape(1, "DC");
						afg.setVoltageOffset( (min + max) / 2 );
						afg.enableChannel( 1 );
						keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance

						var voltage, current;

						experiment.makeIV().then( function( iv ) {
							self.progress("IV_Before", [ iv ] );
							voltage = iv.getXFromIndex( iv.findLevel( 0, { edge: 'descending'} ) );
							console.log( voltage );
							current = iv.get( iv.getDataLength() - 1 );

							experiment.next();
						});
						yield;

						console.log("Device metrics: Voc: " + voltage + "V; Jsc: " + ( current * 1000 ) +"mA");
						keithley.measureVoc( { channel: 'smub', settlingTime: 10 }).then( function( v ) {
							voltage = v;
							console.log('Voltage: ' + v );
							experiment.next();
						});
						yield;


						oscilloscope.setCoupling( 3, coupling);
						oscilloscope.setPosition( 3, 0 );


						afg.setShape( 1, "SIN" );
						afg.setVoltageLow( 1, min );
						afg.setVoltageHigh( 1, max );

						var l = frequencies.length - 1;
						var voltage = 0;


						while( true ) {

							var frequency = frequencies[ l ];
							if( ! frequency ) {
								break;
							}

							var timeBase = 0.2 / frequency;
							console.log( timeBase );
							timeBase = Math.min( timeBase, 1 ); // max 1 sec
							console.log( timeBase );

							oscilloscope.clear();
							oscilloscope.setRecordLength( 10000 );
							oscilloscope.setHorizontalScale( timeBase ); // 20 cycles

							if( timeBase > 40e-3 && coupling == "AC" ) {
								coupling = "DC";
								oscilloscope.setCoupling( 3, coupling );
								oscilloscope.setOffset( 3, voltage );
								oscilloscope.setVerticalScale( 3, 2e-3 ); // 20mV over channel 3

							}
							oscilloscope.enableAveraging( );
							oscilloscope.setNbAverage( Math.min( 10000, Math.max( 2, 0.5 * frequency ) ) );


							afg.setFrequency( 1, frequency );
							afg.enableChannel( 1 );

							oscilloscope.setMeasurementType( 1, "PHASE" );
							oscilloscope.setMeasurementSource( 1, 1 );
							oscilloscope.setMeasurementReference( 1, 3 );

							oscilloscope.setMeasurementType( 2, "AMPLITUDE" );
							oscilloscope.setMeasurementSource( 2, 1 );

							oscilloscope.setMeasurementType( 3, "AMPLITUDE" );
							oscilloscope.setMeasurementSource( 3, 3 );

							oscilloscope.setMeasurementType( 4, "MEAN" );
							oscilloscope.setMeasurementSource( 4, 3 );


							oscilloscope.enableMeasurement( 1 );
							oscilloscope.enableMeasurement( 2 );
							oscilloscope.enableMeasurement( 3 );
							oscilloscope.enableMeasurement( 4 );

							var response = {};
							var offset;

							Promise.all( [

								oscilloscope.getMeasurementUntilStdDev( 1, 0.15, 10, 1 ).then( function( val ) {
									console.log( val.mean );
									console.log( val.stdDev );
									console.log( "Time : " + val.time + " ms" );
									console.log( "Iterations : " + val.nbIterations );
									response.phase = val;

								}),

								oscilloscope.getMeasurementUntilStdDev( 2, 0.15, 10, 1 ).then( function( val ) {
									console.log( val.mean );
									console.log( val.stdDev );
									console.log( "Time : " + val.time + " ms" );
									console.log( "Iterations : " + val.nbIterations );
									response.drive = val;
								}),

								oscilloscope.getMeasurementUntilStdDev( 3, 0.15, 10, 1 ).then( function( val ) {
									console.log( val.mean );
									console.log( val.stdDev );
									console.log( "Time : " + val.time + " ms" );
									console.log( "Iterations : " + val.nbIterations );
									response.response = val;
								})

							]).then( function() {
							//	self.progress("IMPSIMVSData", [ frequency, allWaves["1"], allWaves["3"], impsimvs ] );

								// Auto offset correction

								if( coupling == "DC" ) {
									oscilloscope.getMeasurementMean( 4 ).then( function( offset ) {
										oscilloscope.setOffset( 3, offset );
									});
								} else {


								}

								l--;
								p.next();
								return response;
							});

							yield;
						}

						experiment.makeIV().then( function( iv ) {
							self.progress("IV_After", [ iv ] );
							experiment.next();
						});
						yield;
						afg.disableChannel( 1 );

					} // end while true

					var p = pulse();
					p.next( );
					self.iterator = p;

				}); // End oscilloscope ready

			}); // End returned promise

	}
}


module.exports = experiment;
