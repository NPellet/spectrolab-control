
/**
*  Measures IV at different scans, different speeds
*  Author: Norman Pellet
*  Date: Mai 19, 2015
*/

var defaultExperiment = require("../experiment"),
	extend = require("extend");

var oscilloscope, arduino, afg, keithley;

var experiment = function() {
	this._init();
};
experiment.prototype = new defaultExperiment();


extend( experiment.prototype, {

	defaults: {
		averaging: 200
	},

	init: function( parameters ) {

		keithley = this.getInstrument("keithley-smu");
		arduino = this.getInstrument("arduino");
		oscilloscope = this.getInstrument("tektronix-oscilloscope");
		afg = this.getInstrument("tektronix-functiongenerator");

		this.perturbationJsc = 1000;
		this.perturbationVoc = 1000;
	},

	makeLoop: function() {

		var self = this;

		return function *perturbation() {
			self.sunLevel = arduino.lowestSun();

			var jscDecay, vocDecay;

			while( true ) {

				var iv;
				var vocDecay;
				var jsDecay;
				var voc;
				var jsc;


				self.modal("Enable 50 Ohm", "Please plug in the 50 Ohm terminator", "Ok");
				yield;
				
				self.sunLevel = arduino.getCurrentSunLevel();
				afg.disableChannels();


				/*
				self.iv().then( function( ivCurve ) {
					iv = ivCurve;
					self.loopNext();
				} );
				yield;

				self.getVoc().then( function( v ) {
					voc = v;
					self.loopNext();
				} );
				yield;

				self.getJsc().then( function( j ) {
					jsc = - j;
					self.loopNext();
				} );
				yield;
*/
				//self.progress( "iv", [ iv, voc, jsc, arduino.getSunLevel() ] );
				afg.enableChannel( 1 );

				self.perturbation( 'perturbationVoc' ).then( function( d ) {
					vocDecay = d;
					self.loopNext();
				} );
				yield;
			/*	self.perturbation( 'perturbationJsc' ).then( function( d ) {
					jscDecay = d;
					self.loopNext();
				} );
				yield;
*/

				self.progress( "perturbation", {
														TPV: vocDecay,
											//			TPC: jscDecay,
														Sun: self.sunLevel
													} );

				var breakExperiment = false;

				console.log('Increase');
				arduino.increaseSun().then( function( sun ) {
					sunLevel = sun;
					self.loopNext();
				}, function() {
					breakExperiment = true;
					self.loopNext();
				});


				yield;

				if( breakExperiment ) {
					return;
				}

			}
		}
	},


	iv: function() {
		return keithley.sweepIV( {
			channel: 'smub',
			hysteresis: true,
			startV: 1,
			stopV: -0.2,
			scanRate: 0.2
		})
	},

	getVoc: function() {
		return keithley.measureVoc( {
			channel: 'smub',
			settlingTime: 3
		})
	},

	getJsc: function() {
		return keithley.measureIsc( {
			channel: 'smub',
			settlingTime: 3
		})
	},

	setLight: function( l ) {
		arduino.setWhiteLightLevelVoltage( l );
		return new Promise( function( resolver ) {
			resolver();
		});
	},


	// Applicable with jsc and voc
	perturbation: function( perturbationTxt ) {

		var self = this,
			perturbation = self[ perturbationTxt ] - 50;


		return new Promise( function( resolver, rejecter ) {
			
			var perturbed = 0;
			
			function *perturbator() {

				oscilloscope.setNbAverage( 100 );
				oscilloscope.stopAfterSequence( false );
				oscilloscope.startAquisition();
				while( true ) {

					if( perturbed < 0.5e-3  ) {

						perturbation += 50;
						arduino.setColorLightLevelVoltage( perturbation );
						oscilloscope.clear();
						oscilloscope.startAquisition();


					} else {

						oscilloscope.stopAquisition();
						oscilloscope.clear();
						oscilloscope.setNbAverage( self.config.averaging );
						oscilloscope.stopAfterSequence( true );
						oscilloscope.startAquisition();

						self[ perturbationTxt ] = perturbation;

						oscilloscope.ready().then( function() {

							oscilloscope.getWaves().then( function( w ) {
								console.log('resolver');
								resolver( w[ 3 ] );
							});

						});

						break;
					}

					oscilloscope.clear();
					self.wait( 5 ).then( function() {

						oscilloscope.getMeasurementMean( 1 ).then( function( results ) {

							perturbed = results;
							pert.next();

						} );

					} );

					yield;
				}
			}

			var pert = perturbator();
			pert.next();
		});

	},

	setup: function() {

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
		afg.setPulsePeriod( 1, 10e-3 );
		afg.setPulseWidth( 1, 1e-3 );
		afg.disableChannels( ); // Set the pin LOW
		afg.getErrors();

		afg.disableBurst( 1 );

		/* KEITHLEY SETUP */
		keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
		keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off
		keithley.command( "smub.source.highc = smub.ENABLE;" ); // Turn the output off
		keithley.setDigioPin( 4, 1 ); // Turn white light on

		/* OSCILLOSCOPE SETUP */
		oscilloscope.enableAveraging();

		oscilloscope.setCoupling( 1, "DC");
		oscilloscope.setCoupling( 2, "GND");
		oscilloscope.setCoupling( 3, "AC");
		oscilloscope.setCoupling( 4, "GND");


		oscilloscope.setRecordLength( 100000 );

		oscilloscope.setVerticalScale( 3, 1e-3 );
		oscilloscope.setPosition( 3, -4 );
		oscilloscope.setOffset( 3, 0 );

		oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
		oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
		oscilloscope.setTriggerSlope( 1, "FALL" ); // Trigger on bit going up
		oscilloscope.setTriggerLevel( 0.7 ); // TTL down

		oscilloscope.enableChannels();

		oscilloscope.setTriggerMode("NORMAL");
		oscilloscope.setHorizontalScale( 1e-3 );
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

		return oscilloscope.ready();
	}
});

module.exports = experiment;
