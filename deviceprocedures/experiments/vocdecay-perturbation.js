
var Waveform = require('../../server/waveform');

var experiment = {

  init: function( parameters ) {

    experiment.parameters = parameters;

    experiment.oscilloscope = parameters.instruments["gould-oscilloscope"].instrument;
    experiment.keithley = parameters.instruments["keithley-smu"].instrument;
    experiment.arduino = parameters.instruments.arduino.instrument;

    experiment.parameters.ledPin = 3; // Red light
    experiment.parameters.pulseTime = 0.005; // Pulse time
    experiment.parameters.timeBase = 1e-5; // Pulse time
    experiment.parameters.delay = 0.1

    experiment.lightIntensities = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
  },

  run: function() {

    var self = experiment;
    return new Promise( function( resolver, rejecter ) {

      var recordedWaves = [];


      // Oscilloscope functions
      var preTrigger = 10;

      var baseLine;

      self.oscilloscope.enableAveraging();
      self.oscilloscope.setAveraging( 64 );

      self.oscilloscope.enable50Ohms( 2 );
      self.oscilloscope.disable50Ohms( 3 );

      self.keithley.command( "smua.source.offmode = smua.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
      self.keithley.command( "smua.source.output = smua.OUTPUT_OFF;" ); // Turn the output off

      self.oscilloscope.setVoltScale( 3, 5e-3 ); // 200mV over channel 3
      self.oscilloscope.setVoltScale( 1, 1 ); // 200mV over channel 3

      self.oscilloscope.setCoupling( 1, "DC");
      self.oscilloscope.setCoupling( 2, "GND");
      self.oscilloscope.setCoupling( 3, "AC");
      self.oscilloscope.setCoupling( 4, "GND");


      self.oscilloscope.setTriggerLevel( "A", 1 ); // Set trigger to 0.7V
      self.oscilloscope.setTriggerToChannel( "A", 1 ); // Set trigger on light control
      self.oscilloscope.setTriggerCoupling( "A", "DC" ); // Trigger coupling should be AC
      self.oscilloscope.setTriggerSlope("A", "DOWN"); // Trigger on bit going up
      self.oscilloscope.setPreTrigger( "A", preTrigger ); // Set pre-trigger, 10%
      self.oscilloscope.setTriggerLevel( "A", 1 ); // Set trigger to 0.7V

      self.oscilloscope.setChannelPosition( 2, 2.5 );
      self.oscilloscope.setChannelPosition( 3, -2 );

      self.keithley.command("reset()"); // Reset keithley
      self.keithley.command("*CLS"); // Reset keithley
      self.keithley.command("*RST"); // Reset keithley


      self.keithley.setDigioPin( 4, 1 );

      self.oscilloscope.ready.then( function() {

        function *pulse( ) {

          var vocDecays = [];


          for( var i = 0; i < self.lightIntensities.length; i += 1 ) {

            var vocDecay = new Waveform();
            vocDecay.setXWave();
            var recordedWave = false;

            self.arduino.setWhiteLightLevel( self.lightIntensities[ i ] );

            self.pulse( 256 ).then( function( w ) {
              recordedWave = w;
              p.next();
            });

            yield;


            var m = 0;
            var lastVal = 0;

            var vocDecay = recordedWave
            vocDecays[ i ] = vocDecay

            experiment.progress( vocDecays, self.lightIntensities );
          }

          experiment.done( vocDecays, self.lightIntensities );
        }

        var p = pulse();
        p.next( );

      }); // End oscilloscope ready


    }); // End returned promise

  },

  pulse: function( number ) {

    var self = experiment;
    self.oscilloscope.setTimeBase( self.parameters.timeBase );

    return self.keithley.longPulse( {

      diodePin: self.parameters.ledPin,
      pulseWidth: self.parameters.pulseTime,
      numberOfPulses: number || 1,
      delay: self.parameters.delay

    } ).then( function( value ) {

      return self.oscilloscope.getWaves().then( function( allWaves ) {

        var voltageWave = allWaves[ "3" ];


        return voltageWave;
      });
    });


  }
}

module.exports = experiment;
