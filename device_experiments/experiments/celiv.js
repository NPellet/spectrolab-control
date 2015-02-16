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

		this.parameters.lightLevels = 1;
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

					celiv.next();
				} );
			} );
		}

		// Start the iterator
		var celiv = CELIVPulse();
		celiv.next();


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
