
/**
*  Measures IV at different scans, different speeds
*  Author: Norman Pellet
*  Date: Mai 19, 2015
*/

var defaultExperiment = require("../experiment"),
	extend = require("extend");

var oscilloscope, arduino, afg, keithley;

var experiment = function() {
	this.recordLength = 100000;
	this._init();
};
experiment.prototype = new defaultExperiment();


extend( experiment.prototype, {

	defaults: {
		averaging: 400
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

			while( true ) {

				var TPV;

				self.sunLevel = arduino.getCurrentSunLevel();
				afg.enableChannel( 1 );

				self.perturbation( 'perturbationVoc', 1e-3 ).then( function( d ) {
					TPV = d;
					self.loopNext();
				} );
				yield;
				TPV.subtract( TPV.getAverageP( 0, 0.04 * self.recordLength ) );
				TPV.divideBy( TPV.getAverageP( 0.14 * self.recordLength, 0.15 * self.recordLength ) );
				TPV.shiftX( - TPV.getXFromIndex( 0.15 * self.recordLength ) );

		

				self.progress( "TPV", {	TPV: TPV, Sun: self.sunLevel } );


				var breakExperiment = false;
				arduino.increaseSun().then( function( newSun ) {
					sunLevel = newSun;
					self.loopNext();
				}, function() {
					breakExperiment = true;
					self.loopNext();
				});
				yield;

				if( breakExperiment ) {
					break;
				}

			}

			self.sunLevel = arduino.lowestSun();

			self.modal("Change load resistance", "Plug 50 Ohm termination resistance", "Done");
			yield;

			while( true ) {

				var TPC;
				self.sunLevel = arduino.getCurrentSunLevel();
				afg.enableChannel( 1 );
				self.perturbation( 'perturbationJsc', 0.3e-3 ).then( function( d ) {
					TPC = d;
					self.loopNext();
				} );
				yield;

				TPC.subtract( TPC.getAverageP( 0, 0.04 * self.recordLength ) );
				TPC.divideBy( TPC.getAverageP( 0.14 * self.recordLength, 0.15 * self.recordLength ) );
				TPC.shiftX( - TPC.getXFromIndex( 0.15 * self.recordLength ) );


				self.progress( "TPC", {	TPC: TPC, Sun: self.sunLevel } );

				var breakExperiment = false;

				arduino.increaseSun().then( function( newSun ) {

					sunLevel = newSun;
					self.loopNext();

				}, function() {

					breakExperiment = true;
					self.loopNext();
				});
				yield;

				if( breakExperiment ) {
					break;
				}
			}

			afg.disableChannels();
			arduino.whiteLightOff();
		}
	},



	setLight: function( l ) {
		arduino.setWhiteLightLevelVoltage( l );
		return new Promise( function( resolver ) {
			resolver();
		});
	},


	// Applicable with jsc and voc
	perturbation: function( perturbationTxt, level ) {

		var self = this,
			perturbation = self[ perturbationTxt ] - 50;


		return new Promise( function( resolver, rejecter ) {
			
			var perturbed = 0;
			
			function *perturbator() {

				var max = false;

				oscilloscope.setNbAverage( 100 );
				oscilloscope.stopAfterSequence( false );
				oscilloscope.startAquisition();
				while( true ) {

					if( perturbed < level && max == false ) {

						perturbation += 40;
						if( ! arduino.setColorLightLevelVoltage( perturbation ) ) {
							max = true;
						}

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
					self.wait( 2 ).then( function() {

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
		afg.setPulsePeriod( 1, 11e-3 );
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

		oscilloscope.disable50Ohms( 3 );
		oscilloscope.setRecordLength( this.recordLength );

		oscilloscope.setVerticalScale( 3, 1e-3 );
		oscilloscope.setPosition( 3, -4 );
		oscilloscope.setOffset( 3, 0 );

		oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
		oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
		oscilloscope.setTriggerSlope( 1, "FALL" ); // Trigger on bit going up
		oscilloscope.setTriggerLevel( 0.7 ); // TTL down
		oscilloscope.setTriggerRefPoint( 15 );

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
