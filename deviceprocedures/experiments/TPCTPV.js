
var defaultExperiment = require("../experiment");
var extend = require("extend");
var Waveform = require('../../server/waveform');

var oscilloscope, keithley, arduino, afg;

var experiment = function() {};
experiment.prototype = new defaultExperiment();

extend( experiment.prototype, { 

	// Experiment idea
	// AFG is used to send light pulses. We should use colored diodes as they can flash a lot faster
	// Diodes are on channel 1, transistor is on channel 2.
	// As channel 1 is switched to LOW, the channel 2 is switched to HIGH, thereby shortcircuiting the device.
	// The Jsc decay is recorded on the scope. We can only put the jsc is DC mode as during the pulse, the device is a Voc (not Jsc !). Anyway AC or DC should be irrelevant and yield the same, as the device has 0mA during the pulse.
	// If the pre-pulse is available on Channel 3, we can leave channel 3 on AC mode. We cannot trust the decay as it will drop to 0.

	init: function( parameters ) {
		experiment.parameters = parameters;
		oscilloscope = parameters.instruments["tektronix-oscilloscope"].instrument;
		keithley = parameters.instruments["keithley-smu"].instrument;
		arduino = parameters.instruments.arduino.instrument;
		afg = parameters.instruments["tektronix-functiongenerator"].instrument;
	},


	makeLoop: function() {

		var self = this;

		return function *perturbation() {

			self.sunLevel = arduino.lowestSun();

			perturbationVoc = 1000;
			horizontalScaleV = 200e-4;

			perturbationJsc = 1000;
			horizontalScaleJ = 200e-4;

			while( true ) {

				yield;
				var iv;
				var vocDecay;
				var jsDecay;
				var voc;
				var jsc;

				self.sunLevel = arduino.getSunLevel();
				oscilloscope.disable50Ohms( 3 );
				oscilloscope.disableChannel( 3 );
				oscilloscope.disableChannel( 1 );

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

				experiment.progress( "iv", [ iv, voc, jsc, arduino.getSunLevel() ] );

				oscilloscope.enableChannel( 3 );
				oscilloscope.enableChannel( 1 );

				oscilloscope.setVerticalScale( 3, 1e-3 );
				oscilloscope.setPosition( 3, -4 );
				oscilloscope.setOffset( 3, 0 );

				experiment.perturbationValue = 0;
				experiment.perturbationV( perturnationVoc, horizontalScaleV ).then( function( d ) {
					
					vocDecay = d.wave;
					perturbationVoc = d.perturbation;
					horizontalScaleV = d.horizontalScale;

					experiment.next();
				} );
				yield;

				oscilloscope.setHorizontalScale( experiment.cfg[ sunLevel ].current.xscale );
				oscilloscope.setVerticalScale( 3, 40e-3 ); // experiment.cfg[ sunLevel ].current.yscale

				oscilloscope.enable50Ohms( 3 );
				oscilloscope.setPosition( 3, 0 );

				experiment.perturbationValue = 0;
				experiment.perturbation( jsc, sunLevel, false ).then( function( d ) {
					jscDecay = d;
					experiment.next();
				} );
				yield;

				experiment.progress( "perturbation", { 
														TPV: vocDecay, 
														TPC: jscDecay, 
														Sun: arduino.getSunLevel() 
													} );

				var breakExperiment = false;
				arduino.increaseSun().then( function( sun ) {
					sunLevel = sun;
					experiment.next();
				}, function() {
					breakExperiment = true;
					experiment.next();
				});


//				experiment.setLight( lightLevelVoltage ).then( function() { experiment.next(); });
				yield;

				if( breakExperiment ) {
					return;
				}

			}
		}
	},


	iv: function() {
		var keithley = experiment.keithley;
		return keithley.sweepIV( {
			channel: 'smub',
			hysteresis: true,
			startV: 1,
			stopV: -0.2,
			scanRate: 0.2
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

	perturbationValue: function( perturbation, horizontalScale ) {

		return new Promise( function( resolver, rejecter ) {

			oscilloscope.clear();
			afg.enableChannel( 1 );
			
			oscilloscope.setHorizontalScale( horizontalScale );

			function perturbatorIterator*() {


		        while( true ) {

		            if( perturbed < 1e-3 ) {

						perturbation += 50;
						arduino.setColorLightLevelVoltage( perturbation );

		            } else {

		              break;
		            
		            }

		            oscilloscope.clear();
		            self.wait( 5 ).then( function() {

		            	oscilloscope.getMeasurementMean( 1 ).then( function( results ) {

		            		perturbed = results;
		            		perturbator.next();
		            	} );
		            } );

		            yield;
		        }

		    }

		  	var perturbator = perturbatorIterator();
		  	perturbator.next();

		  });
	  }

	},

	setup: function() {

		if( experiment.isSetup ) {
			return new Promise( function( resolver ) { resolver(); });
		}

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

		oscilloscope.setRecordLength( 100000 );

		oscilloscope.setOffset( 3, 0 );
		oscilloscope.setPosition( 3, -4 );

		oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
		oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
		oscilloscope.setTriggerSlope( 1, "FALL" ); // Trigger on bit going up
		oscilloscope.setTriggerLevel( 0.7 ); // TTL down

		oscilloscope.setTriggerMode("NORMAL");

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

		oscilloscope.stopAfterSequence( true );

		return oscilloscope.ready().then( function( ) {
			experiment.isSetup = true;
		});
	}
});

module.exports = experiment;
