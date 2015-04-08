
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

		experiment.parameters.period = 10e-3;
		experiment.parameters.pulseTime = 2e-6;
		experiment.parameters.averaging = 200;

		experiment.allPerturbations = [ 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500 ];
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
				oscilloscope.disableChannel( 3 );
				oscilloscope.disableChannel( 1 );

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

				experiment.progress( "iv", [ iv, voc, jsc, lightLevelVoltage ] );

				oscilloscope.enableChannel( 3 );
				oscilloscope.enableChannel( 1 );

				oscilloscope.setHorizontalScale( 0.5e-3 );
				oscilloscope.setVerticalScale( 3, 4e-3 );

				experiment.perturbationValue = 0;
				experiment.perturbation( voc, experiment.perturbationValue, true ).then( function( d ) {
					vocDecay = d;
					experiment.next();
				} );
				yield;

				oscilloscope.setHorizontalScale( 0.01e-3 );
				oscilloscope.setVerticalScale( 3, 10e-3 );
				oscilloscope.enable50Ohms( 3 );
				oscilloscope.setPosition( 3, 0 );

				experiment.perturbationValue = 0;
				experiment.perturbation( jsc, experiment.perturbationValue, false ).then( function( d ) {
					jscDecay = d;
					experiment.next();
				} );
				yield;

				experiment.progress( "perturbation", [ vocDecay, jscDecay, lightLevelVoltage ] );

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

	perturbation: function( DC, arduinoPerturbation, voltage ) {

		var arduino = experiment.arduino;
		var afg = experiment.afg;
		var oscilloscope = experiment.oscilloscope;

		experiment.perturbationValue = arduinoPerturbation;

		oscilloscope.clear();
		afg.enableChannel( 1 );
		return new Promise( function( resolver, rejecter ) {

			arduino.setColorLightLevelVoltage( experiment.allPerturbations[ arduinoPerturbation ] );
			oscilloscope.setNbAverage( 16 );

				setTimeout( function() {

					oscilloscope.getMeasurementMean( 1, 2, 4 ).then( function( results ) {

						var perturbation = results[ 0 ];
						var perturbationPk = results[ 2 ];
						var mean = results[ 1 ];
						if( perturbation / DC < 0.05 && perturbation < 4e-3 && experiment.allPerturbations[ arduinoPerturbation + 1 ] ) {
							experiment.perturbation( DC, arduinoPerturbation + 1 ).then( function( w ) {
								resolver( w );
							} );

						} else {

							if( voltage ) {
								oscilloscope.setVerticalScale( 3, perturbation / 4 );
								oscilloscope.setPosition( 3, -4 );
							} else {
								oscilloscope.setVerticalScale( 3, 2e-3 );
								oscilloscope.setOffset( 3, mean );
								oscilloscope.setPosition( 3, 0 );
							}

							oscilloscope.setNbAverage( 800 );
							setTimeout( function() {

								afg.disableChannel( 1 );

								oscilloscope.getChannel( 3 ).then( function( wave3 ) {
									resolver( wave3 );
								} );

							}, 30000 );

						}

					} );

				}, ( ! voltage ? 5000 : 2000 ) );

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
			oscilloscope.setCoupling( 3, "AC");
			oscilloscope.setCoupling( 4, "GND");

			oscilloscope.disableChannels( );

			oscilloscope.setRecordLength( 50000 );

			oscilloscope.setOffset( 3, 0 );
			oscilloscope.setPosition( 3, -4 );

			oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
			oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
			oscilloscope.setTriggerSlope( 1, "FALL" ); // Trigger on bit going up
			oscilloscope.setTriggerLevel( 0.7 ); // TTL down

			oscilloscope.setMeasurementType( 1, "AMPLITUDE" );
			oscilloscope.setMeasurementSource( 1, 3 );
			oscilloscope.enableMeasurement( 1 );

			oscilloscope.setMeasurementType( 2, "MEAN" );
			oscilloscope.setMeasurementSource( 2, 3 );
			oscilloscope.enableMeasurement( 2 );

			oscilloscope.setMeasurementType( 3, "MINImum" );
			oscilloscope.setMeasurementSource( 3, 3 );
			oscilloscope.enableMeasurement( 3 );

			oscilloscope.setMeasurementType( 4, "Pk2Pk" );
			oscilloscope.setMeasurementSource( 4, 3 );
			oscilloscope.enableMeasurement( 4 );

			return oscilloscope.ready();
		}
}

module.exports = experiment;
