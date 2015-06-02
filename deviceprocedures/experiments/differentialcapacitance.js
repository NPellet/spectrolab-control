
/**
 *  Measures Differential capacitance measurement
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

    period: 10e-3,
    pulsetime: 1500e-6,
    averaging: 200,
    horizontal: 500e-6
  },


  // Experiment idea
  // AFG is used to send light pulses. We should use colored diodes as they can flash a lot faster
  // Diodes are on channel 1, transistor is on channel 2.
  // As channel 1 is switched to LOW, the channel 2 is switched to HIGH, thereby shortcircuiting the device.
  // The Jsc decay is recorded on the scope. We can only put the jsc is DC mode as during the pulse, the device is a Voc (not Jsc !). Anyway AC or DC should be irrelevant and yield the same, as the device has 0mA during the pulse.
  // If the pre-pulse is available on Channel 3, we can leave channel 3 on AC mode. We cannot trust the decay as it will drop to 0.

  init: function( parameters ) {

    keithley = this.getInstrument("keithley-smu");
    arduino = this.getInstrument("arduino");
    afg = this.getInstrument("tektronix-functiongenerator");
    oscilloscope = this.getInstrument("tektronix-oscilloscope");
  },



  makeLoop: function() {

    var self = this;
    return function *perturbation() {

      var sunLevel = arduino.lowestSun();
      var perturbation = 1100;
      var avg = 64;

      while( true ) {

        sunLevel = arduino.getSunLevel();

        oscilloscope.disable50Ohms( 3 );
        oscilloscope.disableChannels;
/*
        self.iv().then( function( ivCurve ) {
          iv = ivCurve;
          self.loopNext();
        } );
        yield;
*/

        oscilloscope.setNbAverage( avg );
        oscilloscope.enableChannels( );

        oscilloscope.setVerticalScale( 3, 1e-3 );


        var perturbedVoc = perturbedJsc = 0, perturbedStd;
        var perturbationVoc, perturbationJsc;
        perturbationVoc = perturbationVoc || perturbation;


        // START voltage pulse tuning
        oscilloscope.stopAquisition();
  //      self.switchTodV();
  //      yield;

        afg.enableChannels();
        self.waitAndNext( 10 );
        yield;

        oscilloscope.setNbAverage( 32 );
        oscilloscope.startAquisition();

          while( true ) {

            if( perturbedVoc < 1e-3/* || perturbation > 3000 */) {
              perturbationVoc += 50;
              arduino.setColorLightLevelVoltage( perturbationVoc );

            } else {
              break;
            }

            oscilloscope.clear();
            self.wait( 5 ).then( function() {

              oscilloscope.getMeasurementMean( 1 ).then( function( results ) {

                  if( results ) {
                      perturbedVoc = results;
                      self.loopNext();
                  };

              } );
            } );
            yield;
          }




        // END voltage pulse tuning

        // START current pulse tuning
        self.switchTodJ();
        yield;

        perturbationJsc = perturbationJsc || perturbationVoc;

        while( true ) {
          if( perturbedJsc < 1e-3  ) {
            perturbationJsc += 50;
            arduino.setColorLightLevelVoltage( perturbationJsc );
          } else {
            break;
          }

          oscilloscope.clear();
          self.wait( 2 ).then( function() {
            oscilloscope.getMeasurementMean( 4 ).then( function( results ) {
                perturbedJsc = results;
                self.loopNext();
            } );
          } );
          yield;
        }

        perturbationJsc = perturbation;
        // END current pulse


        // At this point we have a value for jsc and voc perturbation
        var amplVoc, amplJsc
        //  Need to adapt jsc ?
        if( perturbationJsc == perturbationVoc && perturbedJsc > 6e-3 ) {

          amplVoc = 0;
          oscilloscope.setVerticalScale( 3, 40e-3 );
          self.wait( 2 ).then( function() {
            oscilloscope.getMeasurementMean( 1, 2, 4 ).then( function( results ) {
              var amplitude = results[ 0 ];
              amplJsc = amplitude / 5;
              self.loopNext();
            });
          });
          yield;

        } else if( perturbationJsc > perturbationVoc ) { // Need to adapt Voc

          self.switchTodV();
          yield;

          self.keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
          self.keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off
          amplJsc = 0;
          oscilloscope.setVerticalScale( 3, 40e-3 );
          self.wait( 2 ).then( function() {
            oscilloscope.getMeasurementMean( 1, 2, 4 ).then( function( results ) {
              var amplitude = results[ 0 ];
              amplVoc = amplitude / 5;
              self.loopNext();
            });
          });
          yield;

        }

        amplVoc = amplVoc || 1e-3;
        amplJsc = amplJsc || 1e-3;
        console.log("Amplitude Voc: " + amplVoc + "; Amplitude Jc: " + amplJsc );
        /// Record data
        var dV, dJ;


        self.switchTodV();
        yield;
        oscilloscope.setVerticalScale( 3, amplVoc );

        self.perturbation().then( function( w ) {
          dV = w;
          self.loopNext();
        });
        yield;


        self.switchTodJ();
        yield;
        oscilloscope.setVerticalScale( 3, amplJsc );

        self.perturbation().then( function( w ) {
          dJ = w;
          self.loopNext();
        });
        yield;


        self.progress( "perturbation", [ dV, dJ, arduino.getSunLevel() ] );

        var breakExperiment = false;
        arduino.increaseSun().then( function( sun ) {
          sunLevel = sun;
        }, function() {
          breakExperiment = true;
        }).finally( function() {
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
      startV: 1.2,
      stopV: -0.2,
      scanRate: 100
    })
  },

  getVoc: function() {
    return keithley.measureVoc( {
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

  switchTodJ: function( ) {

    var self = this;
    this.getVoc().then( function( voc ) {
      keithley.applyVoltage( { channel: 'smub', voltage: voc } );

      oscilloscope.setCoupling( 3, "DC");
      oscilloscope.setOffset( 3, 0 );
      oscilloscope.setPosition( 3, 0 );
      oscilloscope.enable50Ohms( 3 );
      oscilloscope.setHorizontalScale( self.config.horizontal );
      //oscilloscope.setHorizontalScale( experiment.cfg[ sunLevel ].current.xscale );

      oscilloscope.clear();
      oscilloscope.startAquisition();
      oscilloscope.setNbAverage( 16 );
      oscilloscope.setVerticalScale( 3, 40e-3 );

      afg.enableChannel( 1 );

      self.wait( 2 ).then( function() {
        oscilloscope.getMeasurementMean( 1, 2, 4 ).then( function( results ) {
          oscilloscope.setVerticalScale( 3, 1e-3 );
          oscilloscope.setOffset( 3, results[ 1 ] );

          self.loopNext();
        } );

      } );

    } );

  },

  switchTodV: function() {
    var self = this;
    keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off

  //  oscilloscope.setHorizontalScale( experiment.cfg[ sunLevel ].voltage.xscale );
    oscilloscope.setVerticalScale( 3, 1e-3 );
    oscilloscope.setPosition( 3, -4 );
    oscilloscope.setOffset( 3, 0 );

    oscilloscope.ready().then( function() {
      self.loopNext();
    });

  },



  perturbation: function( ) {

    var self = this;

    afg.enableChannel( 1 );
    return new Promise( function( resolver, rejecter ) {

      self.wait( 2 ).then( function() {

        oscilloscope.stopAfterSequence( false );
        oscilloscope.clear();
        oscilloscope.setNbAverage( 800 );
        oscilloscope.startAquisition();

        self.wait( 20 ).then( function() {
          afg.disableChannel( 1 );

          oscilloscope.getChannel( 3 ).then( function( wave3 ) {

            oscilloscope.stopAfterSequence( false );
            resolver( wave3 );
          });
        });
      });
    });
  },

    setup: function() {


      /* AFG SETUP */
      afg.enableBurst( 1 );
      afg.setShape( 1, "PULSE" );
      afg.setPulseHold( 1 , "WIDTH" );
      afg.setBurstTriggerDelay(  1, 0 );
      afg.setBurstMode( 1, "TRIGGERED");
      afg.setTriggerInternal( );
      afg.setBurstNCycles( 1, 1 );
      afg.setVoltageLow( 1, 0 );
      afg.setVoltageHigh( 1, 1.5 );
      afg.setPulseLeadingTime( 1, 9e-9 );
      afg.setPulseTrailingTime( 1, 9e-9 );
      afg.setPulseDelay( 1, 0 );
      afg.setPulsePeriod( 1, this.config.period );
      afg.setPulseWidth( 1, this.config.pulsetime );
      afg.disableChannels( ); // Set the pin LOW
      afg.getErrors();

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
      oscilloscope.setCoupling( 4, "DC");

      oscilloscope.disableChannels( );

      oscilloscope.setRecordLength( 100000 );

      oscilloscope.setOffset( 3, 0 );
      oscilloscope.setPosition( 3, -4 );

      oscilloscope.setTriggerToChannel( 4 ); // Set trigger on switch channel. Can also use down trigger from Channel 1
      oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be DC
      oscilloscope.setTriggerSlope( 1, "FALL" ); // Trigger on bit going up
      oscilloscope.setTriggerLevel( 0.7 ); // TTL up

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

      oscilloscope.setMeasurementType( 4, "MAXImum" );
      oscilloscope.setMeasurementSource( 4, 3 );
      oscilloscope.enableMeasurement( 4 );

      oscilloscope.stopAfterSequence( false );

      oscilloscope.setCursors( "VBArs" );
      oscilloscope.setCursorsMode( "INDependent" );
      oscilloscope.setCursorsSource( 2 );
      oscilloscope.enableCursors( 2 );

      oscilloscope.setVCursorsPosition( 1, 3e-6 ); // 5%
      oscilloscope.setVCursorsPosition( 2, this.config.horizontal * 9 );

      oscilloscope.setMeasurementGating( "CURSOR" );

      return oscilloscope.ready();
    }
});

module.exports = experiment;
