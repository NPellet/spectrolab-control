
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
    switchChannel: 2,
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
				voltages: [],
				lightLevels: [],
				voltageWaves: []
			};

			var current, voltage;

			while( true ) {

				arduino.setWhiteLightLevel( lightLevel );

				self.pulse( ).then( function( w ) {
					voltage = w[ 3 ];
					self.loopNext();
				} );

				yield;

        afg.setShape( 1, "DC" );
        afg.setVoltageOffset( 1, 1.5 );
        afg.setShape( 2, "DC" );
        afg.setVoltageOffset( 2, 0 );
        afg.enableChannels();


				keithley.measureJ( { channel: 'smub', voltage: 0, settlingTime: 2 }).then( function( measuredJsc ) {
          console.log( measuredJsc );
					jsc = measuredJsc;
					self.loopNext();
				});

				yield;

        self.setAFGPulses();

				results.voltages.push( voltage.getMax() );
				results.jscs.push( jsc );
				results.lightLevels.push( lightLevel );
				results.voltageWaves.push( voltage );
       			results.lastVoltageWave = voltage;

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

		oscilloscope.clear();
		oscilloscope.startAquisition();

    this.wait( 5 ).then( function() {
      afg.enableChannels( );
      afg.trigger();
    });


    return oscilloscope.ready().then( function() {
      afg.disableChannels();
      return oscilloscope.getWaves();
    })
	},

	setup: function() {

		var nbAverage = this.config.averaging;
		var pulsetime = this.config.pulsetime;
		var delaytime = this.config.delaytime;
		var timeBase = this.config.timebase;
		var vscale = this.config.vscale;

    keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
    keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off

		oscilloscope.stopAfterSequence( true );

		oscilloscope.enable50Ohms( 2 );
		oscilloscope.disable50Ohms( 3 );
		oscilloscope.disable50Ohms( 1 );
		oscilloscope.disable50Ohms( 4 );
		oscilloscope.setTriggerMode("NORMAL");

    oscilloscope.setVerticalScale( 2, 20e-3 );
    oscilloscope.setVerticalScale( 3, 150e-3 );
		oscilloscope.setVerticalScale( 4, 1 ); // 1V over channel 4

		oscilloscope.setTriggerCoupling( "AC" ); // Trigger coupling should be AC

		oscilloscope.setCoupling( 1, "DC");
		oscilloscope.setCoupling( 2, "DC");
		oscilloscope.setCoupling( 3, "DC");
		oscilloscope.setCoupling( 4, "DC");

		oscilloscope.setTriggerToChannel( 4 ); // Set trigger on switch channel
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
   		oscilloscope.setHorizontalScale( timeBase );
   		oscilloscope.disableMeasurements();

		oscilloscope.setNbAverage( nbAverage );


		/* AFG SETUP */

		afg.setTriggerExternal(); // Only external trigger

    this.setAFGPulses();

		afg.disableChannels( ); // Set the pin LOW

		afg.getErrors();


		return oscilloscope.ready();
	},

  setAFGPulses: function() {
    var nbAverage = this.config.averaging;
    var pulsetime = this.config.pulsetime;
    var delaytime = this.config.delaytime;
    var timeBase = this.config.timebase;
    var vscale = this.config.vscale;

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


    var pulseChannel = 2;
    afg.enableBurst( pulseChannel );
    afg.setShape( pulseChannel, "PULSE" );
    afg.setPulseHold( pulseChannel , "WIDTH" );
    afg.setBurstTriggerDelay(  pulseChannel, 0 );
    afg.setBurstNCycles( pulseChannel, nbAverage ); // One pulse
    afg.setVoltageLow( pulseChannel, 0 );
    afg.setVoltageHigh( pulseChannel, 1.5 );
    afg.setPulseLeadingTime( pulseChannel, 9e-9 );
    afg.setPulseTrailingTime( pulseChannel, 9e-9 );

    afg.setPulsePeriod( pulseChannel, ( pulsetime + delaytime ) + 1 );
    afg.setPulseWidth( pulseChannel, pulsetime );
    afg.setPulseDelay( pulseChannel, 0 );

  }
});


module.exports = experiment;
