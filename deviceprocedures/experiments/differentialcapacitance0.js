
var Waveform = require('../../server/waveform');

var sunLevel;

var experiment = {

  // Experiment idea
  // AFG is used to send light pulses. We should use colored diodes as they can flash a lot faster
  // Diodes are on channel 1, transistor is on channel 2.
  // As channel 1 is switched to LOW, the channel 2 is switched to HIGH, thereby shortcircuiting the device.
  // The Jsc decay is recorded on the scope. We can only put the jsc is DC mode as during the pulse, the device is a Voc (not Jsc !). Anyway AC or DC should be irrelevant and yield the same, as the device has 0mA during the pulse.
  // If the pre-pulse is available on Channel 3, we can leave channel 3 on AC mode. We cannot trust the decay as it will drop to 0.

  init: function( parameters ) {

    experiment.parameters = parameters;

    experiment.oscilloscope = parameters.instruments["tektronix-oscilloscope"].instrument;
    experiment.keithley = parameters.instruments["keithley-smu"].instrument;
    experiment.arduino = parameters.instruments.arduino.instrument;
    experiment.afg = parameters.instruments["tektronix-functiongenerator"].instrument;

    experiment.parameters.period = 10e-3;
    experiment.parameters.pulseTime = 100e-6;
    experiment.parameters.averaging = 200;
  },

  config: {

    'setConfig': function( cfg ) {
      experiment.cfg = cfg;
    }
  },

  run: function() {

    var afg = experiment.afg;
    var keithley = experiment.keithley;
    var oscilloscope = experiment.oscilloscope;
    var arduino = experiment.arduino;

    sunLevel = arduino.lowestSun();

    function *perturbation() {

      var perturbation = 1100;
      var avg = 64;

      while( true ) {


        experiment.setup().then( function() {
          experiment.next();
        } );
        yield;

        sunLevel = arduino.getSunLevel();

        oscilloscope.disable50Ohms( 3 );
        oscilloscope.disableChannel( 3 );
        oscilloscope.disableChannel( 1 );

        experiment.iv().then( function( ivCurve ) {
          iv = ivCurve;
          experiment.next();
        } );
        yield;


        oscilloscope.setNbAverage( avg );
        oscilloscope.enableChannel( 3 );
        oscilloscope.enableChannel( 1 );


        var perturbedVoc = perturbedJsc = 0;
        var perturbationVoc, perturbationJsc;
        perturbationVoc = perturbation;


        // START voltage pulse tuning

        experiment.switchTodV();
        yield;

        oscilloscope.setNbAverage( 16 );
        oscilloscope.startAquisition();

        while( true ) {

          if( perturbedVoc < 4e-3 || perturbation > 3000 ) {
            perturbationVoc += 50;
            arduino.setColorLightLevelVoltage( perturbationVoc );

          } else {
            break;
          }

          oscilloscope.clear();
          experiment.wait( 2 ).then( function() {
            oscilloscope.getMeasurementMean( 1 ).then( function( results ) {
                perturbedVoc = results[ 0 ];
                experiment.next();
            } );
          } );
          yield;
        }

        // END voltage pulse tuning

        // START current pulse tuning
        experiment.switchTodJ();
        yield;

        perturbationJsc = perturbationVoc;

        while( true ) {
          if( perturbedJsc < 4e-3 || perturbation > 3000 ) {
            perturbationJsc += 50;
            arduino.setColorLightLevelVoltage( perturbationJsc );
          } else {
            break;
          }

          oscilloscope.clear();
          experiment.wait( 2 ).then( function() {
            oscilloscope.getMeasurementMean( 1 ).then( function( results ) {
                perturbedJsc = results[ 0 ];
                experiment.next();
            } );
          } );
          yield;
        }

        perturbationJsc = perturbation;
        // END current pulse


        // At this point we have a value for jsc and voc perturbation

        //  Need to adapt jsc ?
        if( perturbationJsc == perturbationVoc && perturbedJsc > 6e-3 ) {

          oscilloscope.setVerticalScale( 3, 40e-3 );
          experiment.wait( 2 ).then( function() {
            oscilloscope.getMeasurementMean( 1, 2, 4 ).then( function( results ) {
              var amplitude = results[ 0 ];
              amplJsc = amplitude / 5;
              experiment.next();
            });
          });
          yield;

        } else if( perturbationJsc > perturbationVoc ) { // Need to adapt Voc

          self.keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
          self.keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off

          oscilloscope.setVerticalScale( 3, 40e-3 );
          experiment.wait( 2 ).then( function() {
            oscilloscope.getMeasurementMean( 1, 2, 4 ).then( function( results ) {
              var amplitude = results[ 0 ];
              amplVoc = amplitude / 5;
              experiment.next();
            });
          });
          yield;

        }

        amplVoc = amplVoc || 1e-3;
        amplJsc = amplJsc || 1e-3;

        /// Record data
        var dV, dJ;


        experiment.switchTodV();
        yield;
        oscilloscope.setVerticalScale( amplVoc );

        experiment.perturbation().then( function( w ) {
          dV = w;
        });


        experiment.switchTodJ();
        yield;
        oscilloscope.setVerticalScale( amplJsc );

        experiment.perturbation().then( function( w ) {
          dJ = w;
        });


        experiment.progress( "perturbation", [ vocDecay, jscDecay, arduino.getSunLevel() ] );

        var breakExperiment = false;
        arduino.increaseSun().then( function( sun ) {
          sunLevel = sun;
        }, function() {
          breakExperiment = true;
        }).finally( function() {
          experiment.next();
        });

        yield;

        if( breakExperiment ) {
          return;
        }

      }

    }

    var p = perturbation();
    p.next();
    experiment.iterator = p;

  },

  iv: function() {
    var keithley = experiment.keithley;
    return keithley.sweepIV( {
      channel: 'smub',
      hysteresis: true
    })
  },

  getVoc: function() {
    var keithley = experiment.keithley;
    return keithley.measureVoc( {
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

  switchTodJ: function( ) {

    experiment.getVoc().then( function( v ) {
      keithley.biasVoltage( voc );

      oscilloscope.setCoupling( 3, "DC");
      oscilloscope.setOffset( 3, 0 );
      oscilloscope.setPosition( 3, 0 );
      oscilloscope.enable50Ohms( 3 );
      oscilloscope.setHorizontalScale( experiment.cfg[ sunLevel ].current.xscale );

      oscilloscope.clear();
      oscilloscope.startAquisition();
      oscilloscope.setNbAverage( 16 );
      oscilloscope.setVerticalScale( 3, 40e-3 );

      afg.enableChannel( 1 );

      experiment.wait( 2 ).then( function() {
        oscilloscope.getMeasurementMean( 1, 2, 4 ).then( function( results ) {
          oscilloscope.setVerticalScale( 3, 1e-3 );
          oscilloscope.setNbAverage( experiment.avg );
          oscilloscope.setOffset( 3, results[ 1 ] );

          experiment.next();
        } );

      } );

    } );

  },

  switchTodV: function() {

    self.keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off

    oscilloscope.setHorizontalScale( experiment.cfg[ sunLevel ].voltage.xscale );
    oscilloscope.setVerticalScale( 3, 1e-3 );
    oscilloscope.setPosition( 3, -4 );
    oscilloscope.setOffset( 3, 0 );

    experiment.next();
  }



  perturbation: function( ) {

    var arduino = experiment.arduino;
    var afg = experiment.afg;
    var oscilloscope = experiment.oscilloscope;

    oscilloscope.clear();
    afg.enableChannel( 1 );
    return new Promise( function( resolver, rejecter ) {

      experiment.wait( 2 ).then( function() {

        oscilloscope.clear();
        oscilloscope.setNbAverage( 800 );
        oscilloscope.startAquisition();

        oscilloscope.ready().then( function() {
          afg.disableChannel( 1 );

          oscilloscope.getChannel( 3 ).then( function( wave3 ) {
            resolver( wave3 );
          } );

        });

      });


    });

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
}

module.exports = experiment;
