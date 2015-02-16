
var Waveform = require('../../server/waveform');

var experiment = function() { };

experiment.prototype = {

	init: function( parameters ) {

		if( ! parameters.oscilloscope || ! parameters.keithley || ! parameters.arduino || ! parameters.afg ) {
			throw "An oscilloscope and a keithley SMU and an Arduino with analog output are required";
		}

		this.parameters = parameters;

		this.oscilloscope = parameters.oscilloscope;
		this.keithley = parameters.keithley;
		this.arduino = parameters.arduino;
		this.afg = parameters.afg;

		this.parameters.lightLevels = this.parameters.lightLevels || [ 0 ];
		this.parameters.pulseLengths = this.parameters.pulseLengths || [ 20e-9 ];


	},

	run: function() {

		var self = this;
		var pulsePeriod = 1e-3;


		this.afg.setTriggerOut( 1, "TRIGGER" );
		this.afg.enableBurst( 1);
		this.afg.setBurstTriggerDelay(  1, 0 );

		this.afg.setBurstMode( 1, "TRIGGERED");
		this.afg.setBurstNCycles( 1, 1);

		this.afg.setShape( 1, 'pulse');
		this.afg.setPulsePeriod( pulsePeriod ); // 1ms in total
		this.afg.setVoltageLow( 1, 0)
		this.afg.setVoltageHigh( 1, 5);
		this.afg.setPulseWidth(  1, this.parameters.pulseLengths[ 0 ] );
		this.afg.setPulseLeadingTime( 1, 9e-9 );
		this.afg.setPulseTrailingTime( 1, 9e-9 );


		self.oscilloscope.enableAveraging();
		self.oscilloscope.setAverage( this.parameters.averaging );

		self.oscilloscope.disable50Ohms( 3 );

		self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
		self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

		self.oscilloscope.setVoltScale( 3, 200e-3 ); // 200mV over channel 3

		self.oscilloscope.setTriggerCoupling( "A", "AC" ); // Trigger coupling should be AC
		self.oscilloscope.setCoupling( 3, "DC");

		self.oscilloscope.setTriggerToChannel( "A", 1 ); // Set trigger on pulse channel
		self.oscilloscope.setTriggerCoupling( "A", "DC" ); // Trigger coupling should be AC
		self.oscilloscope.setTriggerSlope("A", "UP"); // Trigger on bit going up
		self.oscilloscope.setPreTrigger( "A", 10 ); // Set pre-trigger, 10%

		self.oscilloscope.setChannelPosition( 3, -2 );

		return new Promise( function( resolver, rejecter ) {

			// Turn the channel 1 on
			self.afg.turnChannelOn( 1 );

			setTimeout( function() {
				// Turn it off
				self.afg.turnChannelOff( 1 );

				self.oscilloscope.getWave( 3 ).then( function( wave ) {

						resolver( wave );
				});

			}, ( pulsePeriod * self.parameters.averaging * 2 ) );

		});

	}
}

module.exports = experiment;
