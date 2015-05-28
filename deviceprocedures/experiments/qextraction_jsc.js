
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
  	averaging: 8,
  	blankaveraging: 128,
    pulseChannel: 1,
    delaytime: 2,
    pulsetime: 1,
    timebase: 50e-3,
    vscale: 80
  },

  init: function( parameters ) {

 	keithley = this.getInstrument("keithley-smu");
    arduino = this.getInstrument("arduino");
    afg = this.getInstrument("tektronix-functiongenerator");
	oscilloscope = this.getInstrument("tektronix-oscilloscope");
  },

	makeLoop: function() {

		var self = this;

		var preTrigger = 10;
		var recordLength = 100000;
		var yscales = {};

		return function *pulse(  ) {

			oscilloscope.setRecordLength( recordLength );


			var lightLevel = 0;

			var results = {
				jscs: [],
				charges: [],
				lightLevels: [],
				currentWaves: [],
				voltageWaves: []
			};

			var current;

			while( true ) {

				arduino.setWhiteLightLevel( lightLevel );
				yscales[ lightLevel ] = yscales[ lightLevel ] || yscales[ lightLevel - 1 ] || self.config.vscale;
				var breakit = false;

				self.pulse( yscales[ lightLevel ] ).then( function( w ) {

					oscilloscope.getMeasurementMean( 1, 2 ).then( function( measurements ) {
							if( measurements[ 0 ] < 2 * yscales[ lightLevel ] && yscales[ lightLevel ] > 1e-3 ) {
								//oscilloscope.setOffset( 2, measurements[ 1 ] );
								yscales[ lightLevel ] = measurements[ 0 ] / 7;
								breakit = true;

							} else {
								current = w[ 2 ];
							}

							self.loopNext();
					} );

				} );
				yield;

				if( breakit ) {
					continue;
				}

				self.pulseBlank(  ).then( function( w ) {

					current.subtract( w[ 2 ] );
					self.loopNext();
				});
				yield;

				current.divide( 50 );

				var jsc = current.average( recordLength * 0.09, recordLength * 0.1 );
				var charges = current.integrateP( Math.round( 0.1 * recordLength ), recordLength - 1 );

				results.jscs.push( jsc );
				results.charges.push( charges );
				results.lightLevels.push( lightLevel );
				results.currentWaves.push( current );
       			results.lastCurrentWave = current;

				self.progress( "charge", results );


				if( lightLevel >= 12 ) {
					break;
				}
				lightLevel++;
			}

			oscilloscope.disableChannels();
		}

	},

	pulse: function( vscale ) {

		var nb = this.config.averaging;

		oscilloscope.setNbAverage( nb );
		oscilloscope.clear();
		oscilloscope.startAquisition();

	    oscilloscope.setVerticalScale( 2, vscale );

	    afg.setBurstNCycles( 1, nb );
	    afg.setBurstNCycles( 2, nb );

	    afg.setPulsePeriod( 2, ( this.config.pulsetime + this.config.delaytime ) + 1 );
	    afg.setPulseWidth( 2, this.config.delaytime );
	    afg.setPulseDelay( 2, this.config.pulsetime );

		afg.enableChannel( 1 );

		afg.trigger();

		return this.wait( ( this.config.delaytime + this.config.pulsetime + 1 ) * nb + 2 ).then( function() {
			afg.disableChannels();
    		return oscilloscope.getWaves();
		});
	},


	pulseBlank: function(  ) {

		var self = experiment;
		var nb = this.config.blankaveraging;

		oscilloscope.setNbAverage( nb );
		oscilloscope.setTriggerMode("AUTO");
		oscilloscope.setHorizontalScale( timeBase );
		oscilloscope.setVerticalScale( 3, yScale ); // 2mV over channel 2
		oscilloscope.clear();
		oscilloscope.startAquisition();

		return this.wait( 10 ).then( function() {
			return oscilloscope.getWaves();
		})
	},

	setup: function() {

		var nbAverage = this.config.averaging;
		var pulsetime = this.config.pulsetime;
		var delaytime = this.config.delaytime;
		var timeBase = this.config.timebase;
		var vscale = this.config.vscale;

			oscilloscope.stopAfterSequence( false );

			oscilloscope.disable50Ohms( 2 );
			oscilloscope.enable50Ohms( 3 );
			oscilloscope.disable50Ohms( 1 );
			oscilloscope.disable50Ohms( 4 );

			oscilloscope.setHorizontalScale( timeBase );
			oscilloscope.setVerticalScale( 3, vscale ); // 200mV over channel 3
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


			/* AFG SETUP */

			afg.setTriggerExternal(); // Only external trigger

			var pulseChannel = 1;
			afg.enableBurst( pulseChannel );
			afg.setShape( pulseChannel, "PULSE" );
			afg.setPulseHold( pulseChannel , "WIDTH" );
			afg.setBurstTriggerDelay(  pulseChannel, 0 );
			afg.setBurstNCycles( pulseChannel, nbAverage );
			afg.setVoltageLow( pulseChannel, 0 );
			afg.setVoltageHigh( pulseChannel, 1.5 );
			afg.setPulseLeadingTime( pulseChannel, 9e-9 );
			afg.setPulseTrailingTime( pulseChannel, 9e-9 );
			afg.setPulseDelay( pulseChannel, 0 );
			afg.setPulsePeriod( pulseChannel, ( pulsetime + delaytime ) + 1 );
			afg.setPulseWidth( pulseChannel, pulsetime );

			afg.disableChannels( ); // Set the pin LOW

			afg.getErrors();


		return oscilloscope.ready();
	}
});


module.exports = experiment;
