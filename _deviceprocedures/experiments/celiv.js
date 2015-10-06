/**
 *	Photo-CELIV experiment file
 *	Experimental procedure
 *	Device is illuminated at Voc for a indeterminate time (200us or so). Time of illumination is not important.
 *	At time t = 0, light is turned off. Device is connected at high impedance on the scope. Voc decay is monitored.
 *	At various times t = t1, t2, ... we switch the device to Jsc and apply a reverse bias linearly increasing pulse of voltage
 *	Current is monitored
 *
 *  Electrical setup
 *	Trig IN is the shut down of the lamp brought by the Keithley
 *	Channel 1 is the gate of the transistor. TTL pulse with the same pulse length as the reverse bias pulse
 *	Channel 2 is the pulse on the device
 */


var Waveform = require('../../server/waveform');

var experiment = function() { };

experiment = {

	init: function( parameters ) {

		this.parameters = parameters;

		this.oscilloscope = parameters.instruments['gould-oscilloscope'].instrument;
		this.keithley = parameters.instruments['keithley-smu'].instrument;
		this.arduino = parameters.instruments.arduino.instrument;
		this.afg = parameters.instruments['tektronix-functiongenerator'].instrument;

		this.parameters.lightLevels = 1;
		this.parameters.pulseLengths = this.parameters.pulseLengths || [ 20e-9 ];

		this.paused = false;


		function *CELIVPulse() {


			this.afg.setPulseLeadingTime( 2, pulseLength );
			this.afg.setPulseWidth( 1, pulseLength );

			this.afg.setPulseDelay( 2, pulseDelay );
			this.afg.setPulseDelay( 1, pulseDelay );


			// Main driving time is the keithley
			this.keithley.longPulse( {

				LEDPin: 4, // White LED
				nbPulses: 64

			} ).then( function() {

				self.oscilloscope.getWaves().then( function( waves ) {

					experimentResults.push( {

						pulseDelay: pulseDelay,
						pulseLength: pulseLength,

						vocDecay: waves[ "3" ],
						celiv: waves[ "2" ]
					} );

					if( ! self.paused ) {
						self.iterator.next();
					}

				} );
			} );
		}

		self.iterator = CELIVPulse();
	},

	run: function() {

		var self = this;
		var pulsePeriod = 1e-3;
		var pulseDelay = 1e-5;
		var pulseLength = 100e-6;

		this.afg.setTriggerOut( 1, "TRIGGER" );
		this.afg.enableBurst( 1);
		this.afg.setBurstTriggerDelay(  1, 0 );

		this.afg.setBurstMode( 1, "TRIGGERED");
		this.afg.setBurstNCycles( 1, 1);

		this.afg.setShape( 1, 'pulse');
		this.afg.setShape( 2, 'pulse');

		this.afg.setPulsePeriod( 1, pulsePeriod ); // 1ms in total
		this.afg.setPulsePeriod( 2, pulsePeriod ); // 1ms in total

		this.afg.setVoltageLow( 1, 0)
		this.afg.setVoltageHigh( 1, 5);

		this.afg.setVoltageLow( 2, 0)
		this.afg.setVoltageHigh( 2, 5);


		this.afg.setPulseLeadingTime( 1, 9e-9 );
		this.afg.setPulseTrailingTime( 1, 9e-9 );

		this.arduino.setWhiteLightLevel( this.parameters.lightLevel );

		this.oscilloscope.enableAveraging();
		this.oscilloscope.setAverage( this.parameters.averaging );

		this.oscilloscope.disable50Ohms( 3 );

		this.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
		this.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

		this.oscilloscope.setVoltScale( 3, 200e-3 ); // 200mV over channel 3

		this.oscilloscope.setTriggerCoupling( "A", "AC" ); // Trigger coupling should be AC
		this.oscilloscope.setCoupling( 3, "DC");

		this.oscilloscope.setTriggerToChannel( "A", 1 ); // Set trigger on pulse channel
		this.oscilloscope.setTriggerCoupling( "A", "DC" ); // Trigger coupling should be AC
		this.oscilloscope.setTriggerSlope("A", "UP"); // Trigger on bit going up
		this.oscilloscope.setPreTrigger( "A", 10 ); // Set pre-trigger, 10%

		this.oscilloscope.setChannelPosition( 3, -2 );

		self.iterator.next();

		}

		this.afg.ready().then( function() {
			// Start the iterator
			var celiv = CELIVPulse();
			console.log(1);
			celiv.next();
			console.log(2);

		});



	}
}

module.exports = experiment;
