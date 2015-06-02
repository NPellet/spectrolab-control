

/**
 *  Measures IV at different scans, different speeds
 *  Author: Norman Pellet
 *  Date: Mai 19, 2015
 */

var defaultExperiment = require("../experiment"),
  extend = require("extend");

var oscilloscope, arduino, afg;

var experiment = function() {
  this._init();
};
experiment.prototype = new defaultExperiment();


extend( experiment.prototype, {

  defaults: {
  	ledPin: 4,
  	pulseTime: 10,
    delay: 15,
    timebase: 0.1,
    lightIntensities: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ]
  },

  init: function( parameters ) {

 	keithley = this.getInstrument("keithley-smu");
    arduino = this.getInstrument("arduino");
    oscilloscope = this.getInstrument("tektronix-oscilloscope");
  },

  makeLoop: function() {

		var self = this;

		var preTrigger = 10;
		var recordLength = 100000;
		var yscales = {};

		return function *pulse(  ) {

			var recordedWave;
			oscilloscope.setRecordLength( recordLength );
			oscilloscope.setTriggerRefPoint( preTrigger * 100 ); // Set pre-trigger, 10%

			for( var i = 0; i < self.config.lightIntensities.length; i += 1 ) {

				
				arduino.setWhiteLightLevel( self.config.lightIntensities[ i ] );
				oscilloscope.clear();
	
				// Wait two seconds				
				self.waitAndNext( 2 );
				yield;

				// Pulse the light
				self.pulse( self.config.timebase, 1 ).then( function( w ) {
					recordedWave = w;
					self.loopNext();
				});
				yield;

				// Extract the interesting part
				recordedWave = recordedWave.subset( ( recordLength - 1 ) * preTrigger, recordLength - 1 );
				// No need to save 100k points...
				recordedWave = recordedWave.degradeExp( 1000, 0.05 );

				// Shift to 1us initial value
				recordedWave.shiftXToMin( 1e-6 );

				vocDecays[ i ] = recordedWave

				self.progress( "vocdecay", {
					vocDecays: vocDecays,
					lightIntensities: self.config.lightIntensities
				});
			}

			self.terminate( { decays: vocDecays, lightIntensities: self.lightIntensities } );
		}
	},

	pulse: function( timeBase, number, delay ) {

		var self = this;

		return self.keithley.longPulse( {

			diodePin: self.config.ledPin,
			pulseWidth: self.config.pulseTime,
			numberOfPulses: number || 1,
			delay: delay || self.config.delay

		} ).then( function( value ) {

			return oscilloscope.getWaves().then( function( allWaves ) {
				var voltageWave = allWaves[ "3" ];
				return voltageWave;
			});
		});
	},

	setup: function() {

		oscilloscope.disableAveraging();

		oscilloscope.enable50Ohms( 2 );
		oscilloscope.disable50Ohms( 3 );

		keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
		keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off


		oscilloscope.setVerticalScale( 3, 200e-3 ); // 200mV over channel 3

		oscilloscope.setCoupling( 1, "DC");
		oscilloscope.setCoupling( 2, "GND");
		oscilloscope.setCoupling( 3, "DC");
		oscilloscope.setCoupling( 4, "GND");



		oscilloscope.stopAfterSequence( false );


		oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel
		oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be AC
		oscilloscope.setTriggerSlope( 4, "FALL"); // Trigger on bit going up
		oscilloscope.setTriggerLevel( 0.7 ); // Set trigger to 0.7V
		oscilloscope.setHorizontalScale( this.config.timebase );

		oscilloscope.setPosition( 3, -4 );

		return oscilloscope.ready();
	}
});

module.exports = experiment;