
var Waveform = require('../../server/waveform');
var _ = require('lodash');

var experiment = {

	// Experiment idea
	// AFG is used to send light pulses. We should use colored diodes as they can flash a lot faster
	// Diodes are on channel 1, transistor is on channel 2.
	// As channel 1 is switched to LOW, the channel 2 is switched to HIGH, thereby shortcircuiting the device.
	// The Jsc decay is recorded on the scope. We can only put the jsc is DC mode as during the pulse, the device is a Voc (not Jsc !). Anyway AC or DC should be irrelevant and yield the same, as the device has 0mA during the pulse.
	// If the pre-pulse is available on Channel 3, we can leave channel 3 on AC mode. We cannot trust the decay as it will drop to 0.

	init: function( parameters ) {

		experiment.parameters = parameters;

		experiment.oscilloscope = parameters.instruments["gould-oscilloscope"].instrument;
		experiment.afg = parameters.instruments["tektronix-functiongenerator"].instrument;
		experiment.keithley = parameters.instruments["keithley-smu"].instrument;

		experiment.parameters.defaultAveraging = 128;
	},


	focusOn: function( id ) {
		experiment.focus = id;
	},

	makeIV: function() {


		return experiment.keithley.sweepIV( {
			channel: 'smub',
			startV: 1,
			stopV: 0,
			settlingTime: 0.02,
			timeDelay: 2,
			complianceI: 1,
			nbPoints: 100
		} ).then( function( iv ) {

			experiment.iterator.next();
			return iv;
		});
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

			var afg = experiment.afg;
			var keithley = experiment.keithley;
			var oscilloscope = experiment.oscilloscope;

			var self = experiment;
			var preTrigger = 30;

			var impsimvs = 'imvs';

			/* AFG SETUP */
			var min = 2.1;
			var max = 2.8;


			afg.disableChannels( ); // Set the pin LOW
			afg.getErrors();


			oscilloscope.enableAveraging();

			oscilloscope.enable50Ohms( 1 );
			oscilloscope.disable50Ohms( 3 );

			oscilloscope.setVoltScale( 3, 5e-3 ); // 20mV over channel 3
			oscilloscope.setVoltScale( 1, 500e-3 ); // 20mV over channel 3

			oscilloscope.setCoupling( 1, "DC");
			oscilloscope.setCoupling( 3, "DC");

			oscilloscope.setTriggerToChannel( "A", "2" ); // Set trigger on switch channel. Can also use down trigger from Channel 1
			oscilloscope.setTriggerCoupling( "A", "DC" ); // Trigger coupling should be DC
			oscilloscope.setTriggerSlope("A", "UP"); // Trigger on bit going up
			oscilloscope.setTriggerLevel("A", 2); // Trigger on bit going up
			oscilloscope.setPreTrigger( "A", 0 ); // Set pre-trigger, 10%


			oscilloscope.setChannelPosition( 3, 0 );
			oscilloscope.setChannelPosition( 2, 0 );

			oscilloscope.setTriggerLevel( "A", 0.7 ); // Set trigger to 0.7V



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
			console.log( b );
			var a = y1 / Math.pow( 2.71828, - x1 * b );
			console.log( a );

			var frequencies = [];

			for( var i = x1; i <= x2 ; i += 1) {
				frequencies.push( Math.round( a * Math.exp( - b * i )  * 100 ) / 100 );
			}

			return new Promise( function( resolver, rejecter ) {

				self.oscilloscope.ready.then( function() {


					function *pulse( ) {

						afg.setShape(1, "DC");
						afg.setVoltageOffset( (min + max) / 2 );
						afg.enableChannel( 1 );
						keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance

						experiment.makeIV().then( function( iv ) {
							self.progress("IV_Before", [ iv ] );
						});
						yield;


						if( impsimvs == 'imvs' ) {

							var voltage;
							keithley.measureVoc( { channel: 'smub', settlingTime: 2 }).then( function( v ) {
								console.log( "Voltage:", v );
								p.next( v );
							})
							voltage = yield;
							var delta;
							if( voltage > 0.5 ) {
								delta = voltage - 0.5;
								voltage = 0.5;
							} else {
								delta = 0;
							}
							oscilloscope.setChannelOffset( 3, - voltage );

								oscilloscope.setChannelPosition( 3, - delta / 5e-3 );
								oscilloscope.setVoltScale( 3, 5e-3 );


							oscilloscope.disable50Ohms( 3 );


						} else {

							var current;
							keithley.measureIsc( { channel: 'smub', settlingTime: 2 } ).then( function( c ) {
								p.next( c );
							});
							current = yield;
							current *= 50; // 50 ohm

							console.log( "Current: ", current );
							var delta;
							if( current > 0.5 ) {
								delta = current - 0.5;
								current = 0.5;
							} else {
								delta = 0;
							}

							oscilloscope.setChannelPosition( 3, - delta / 2e-3 );
							oscilloscope.setVoltScale( 3, 2e-3 );
							oscilloscope.setChannelOffset( 3, - current);
							oscilloscope.enable50Ohms( 3 ); // IMPS
						}


						afg.enableBurst( 1 );
						afg.setBurstNCycles( 1, 50 );
						afg.setShape( 1, "SIN" );
						afg.setBurstMode( 1, "TRIGGERED");
						afg.setVoltageLow( 1, min );
						afg.setVoltageHigh( 1, max );


						var l = frequencies.length - 1;
						var voltage = 0;

						afg.enableChannel( 1 );

						while( true ) {

							var frequency = frequencies[ l ];

							var timeBase = 1 / frequency / 2;
							timeBase = Math.min( timeBase, 1 ); // max 1 sec

							if( ! frequency ) {
								break;
							}
							afg.setFrequency( 1, frequency );

							l--;

							var time = 30; // 15 sec aquisition
							if( frequency < 1 ) {
								time = 100; // allow till 0.1 Hz
							}

							var timeBase = oscilloscope.setTimeBase( timeBase ); // 20 cycles

							averaging = ( time / timeBase / 12 );
							averaging = Math.min( averaging, experiment.parameters.defaultAveraging );


							oscilloscope.setAveraging( averaging );


							setTimeout( function() {
								self.oscilloscope.getWaves().then( function( allWaves ) {

									self.progress("IMPSIMVSData", [ frequency, allWaves["1"], allWaves["3"], impsimvs ] );
									p.next(  );
								});

							}, time * 1000 );
							console.log( time );

							yield;



						}

						experiment.makeIV().then( function( iv ) {
							self.progress("IV_After", [ iv ] );
						});
						yield;
						afg.disableChannel( 1 );

					} // end while true

					//	resolver( [ waveVoc, wavedV, wavedQ, wavedC ] );
				 // end generator


					var p = pulse();
					p.next( );
					self.iterator = p;


				}); // End oscilloscope ready

			}); // End returned promise

	}
}


module.exports = experiment;
