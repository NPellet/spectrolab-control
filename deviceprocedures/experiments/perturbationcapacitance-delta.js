
var Waveform = require('../../server/waveform');

var experiment = {

	// Experiment idea
	// AFG is used to send light pulses. We should use colored diodes as they can flash a lot faster
	// Diodes are on channel 1, transistor is on channel 2.
	// As channel 1 is switched to LOW, the channel 2 is switched to HIGH, thereby shortcircuiting the device.
	// The Jsc decay is recorded on the scope. We can only put the jsc is DC mode as during the pulse, the device is a Voc (not Jsc !). Anyway AC or DC should be irrelevant and yield the same, as the device has 0mA during the pulse.
	// If the pre-pulse is available on Channel 3, we can leave channel 3 on AC mode. We cannot trust the decay as it will drop to 0.

	init: function( parameters ) {

		experiment.parameters = parameters;

		experiment.oscilloscope = parameters.instruments["tektronix-oscilloscope"].instrument;
		experiment.keithley = parameters.instruments["keithley-smu"].instrument;
		experiment.arduino = parameters.instruments.arduino.instrument;
		experiment.afg = parameters.instruments["tektronix-functiongenerator"].instrument;

		experiment.parameters.period = 20e-3;
		experiment.parameters.pulseTime = 5e-3;
		experiment.parameters.averaging = 64;

		experiment.allPerturbations = [ 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900 ];
	},

	run: function() {

		var afg = experiment.afg;
		var keithley = experiment.keithley;
		var oscilloscope = experiment.oscilloscope;
		var arduino = experiment.arduino;



		var lightLevelVoltage = arduino.params.whiteLightLED.lowestSunLevel;

		function *perturbation() {

			while( true ) {

				experiment.setup().then( function() {

					experiment.next();

				} );
				yield;

				var iv;
				var vocDecay;
				var jsDecay;
				var voc;
				var jsc;

				oscilloscope.disable50Ohms( 3 );

				experiment.perturbationValue = 0;
				experiment.setLight( lightLevelVoltage ).then( function() { experiment.next(); });
				yield;


				experiment.iv().then( function( ivCurve ) {
					iv = ivCurve;
					experiment.next();
				} );
				yield;

				experiment.getVoc().then( function( v ) {
					voc = v;
					experiment.next();
				} );
				yield;

				experiment.getJsc().then( function( j ) {
					jsc = - j;
					experiment.next();
				} );
				yield;

				oscilloscope.setOffset( 3, voc );
				oscilloscope.setHorizontalScale( 1e-3 );
				oscilloscope.setVerticalScale( 3, 4e-3 );

				experiment.perturbation( voc, 0 ).then( function( d ) {
					vocDecay = d;
					experiment.next();
				} );
				yield;

				oscilloscope.setHorizontalScale( 0.1e-3 );
				oscilloscope.setVerticalScale( 3, 1e-3 );
				oscilloscope.setOffset( 3, - jsc  );
				oscilloscope.enable50Ohms( 3 );
				experiment.perturbation( jsc, experiment.perturbationValue, true ).then( function( d ) {
					jscDecay = d;
					experiment.next();
				} );
				yield;

				experiment.progress( iv, voc, jsc, vocDecay, jscDecay );

				lightLevelVoltage += 100;

				if( lightLevelVoltage > arduino.params.whiteLightLED.highestSunLevel ) {
					break;
				}
			}

		}

		var p = perturbation();
		p.next();
		experiment.iterator = p;

	},

	iv: function() {
		var keithley = experiment.keithley;
		return keithley.sweepIV( {
			channel: 'smub',
			hysteresis: true
		})
	},

	getVoc: function() {
		var keithley = experiment.keithley;
		return keithley.measureVoc( {
			channel: 'smub',
			settlingTime: 3
		})
	},

	getJsc: function() {
		var keithley = experiment.keithley;
		return keithley.measureIsc( {
			channel: 'smub',
			settlingTime: 3
		})
	},

	setLight: function( l ) {
		experiment.arduino.setWhiteLightLevelVoltage( l );
		return new Promise( function( resolver ) {
			resolver();
		});
	},

	perturbation: function( DC, arduinoPerturbation, lockPerturbation ) {

		var arduino = experiment.arduino;
		var afg = experiment.afg;
		var oscilloscope = experiment.oscilloscope;

		experiment.perturbationValue = arduinoPerturbation;

		oscilloscope.clear();

		return new Promise( function( resolver, rejecter ) {

			arduino.setColorLightLevelVoltage( experiment.allPerturbations[ arduinoPerturbation ] );

			afg.enableChannel( 1 );
			oscilloscope.setChannelOffset( 3, 0 );
			oscilloscope.setVerticalScale( 3, 200e-3 );
			setTimeout( function() {

				oscilloscope.getMeasurementMean( 2 ).then( function( mean ) {
					oscilloscope.setChannelOffset( 3, mean );
					perturb();
				})

			}, 10000 );

			function perturb() {
				setTimeout( function() {


					oscilloscope.getMeasurementMean( 1 ).then( function( perturbation ) {

						afg.disableChannel( 1 );
	console.log( perturbation, DC, perturbation / DC * 100 + "%", lockPerturbation, experiment.allPerturbations[ arduinoPerturbation + 1 ], experiment.allPerturbations, arduinoPerturbation );
						if( perturbation / DC < 0.03 && ! lockPerturbation && experiment.allPerturbations[ arduinoPerturbation + 1 ] ) {
	console.log('increase');
							experiment.perturbationValue = arduinoPerturbation + 1;
							experiment.perturbation( DC, arduinoPerturbation + 1 ).then( function( w ) {
								resolver( w );
							} );

						} else {

							oscilloscope.getChannel( 3 ).then( function( wave3 ) {
								resolver( wave3 );
							} );
						}

					} );

				}, 4000 );
			}
			});

	},

		setup: function() {

			var afg = experiment.afg;
			var keithley = experiment.keithley;
			var oscilloscope = experiment.oscilloscope;
			var arduino = experiment.arduino;

			/* AFG SETUP */
			afg.enableBurst( 1 );
			afg.setShape( 1, "PULSE" );
			afg.setPulseHold( 1 , "WIDTH" );
			afg.setBurstTriggerDelay(  1, 0 );
			afg.setBurstMode( 1, "TRIGGERED");
			afg.setBurstNCycles( 1, 1 );
			afg.setVoltageLow( 1, 0 );
			afg.setVoltageHigh( 1, 1.5 );
			afg.setPulseLeadingTime( 1, 9e-9 );
			afg.setPulseTrailingTime( 1, 9e-9 );
			afg.setPulseDelay( 1, 0 );
			afg.setPulsePeriod( 1, experiment.parameters.period );
			afg.setPulseWidth( 1, experiment.parameters.pulseTime );
			afg.disableChannels( ); // Set the pin LOW
			afg.getErrors();

			/* KEITHLEY SETUP */
			keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
			keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off
			keithley.command( "smub.source.highc = smub.ENABLE;" ); // Turn the output off
			keithley.setDigioPin( 4, 1 ); // Turn white light on

			/* OSCILLOSCOPE SETUP */
			oscilloscope.enableAveraging();
			oscilloscope.setNbAverage( experiment.parameters.averaging );

			oscilloscope.setCoupling( 1, "DC");
			oscilloscope.setCoupling( 2, "GND");
			oscilloscope.setCoupling( 3, "DC");
			oscilloscope.setCoupling( 4, "GND");

			oscilloscope.setOffset( 3, 0 );
			oscilloscope.setPosition( 3, -2 );

			oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
			oscilloscope.setTriggerCoupling( "AC" ); // Trigger coupling should be DC
			oscilloscope.setTriggerSlope( 1, "FALL" ); // Trigger on bit going up
			oscilloscope.setTriggerLevel( 0.7 ); // TTL down

			oscilloscope.setMeasurementType( 1, "AMPLITUDE" );
			oscilloscope.setMeasurementSource( 1, 3 );
			oscilloscope.enableMeasurement( 1 );

			oscilloscope.setMeasurementType( 1, "MEAN" );
			oscilloscope.setMeasurementSource( 1, 3 );
			oscilloscope.enableMeasurement( 1 );

			return oscilloscope.ready();
		}
}

module.exports = experiment;
