
var Waveform = require('../../server/waveform');
var _ = require('lodash');

var experiment = {

  init: function( parameters ) {

    experiment.parameters = parameters;

    experiment.keithley = parameters.instruments["keithley-smu"].instrument;
    experiment.arduino = parameters.instruments["arduino"].instrument;

    experiment.parameters.lightIntensities = [ 0 ];
  },


  focusOn: function( id ) {
    experiment.focus = id;
  },

  config: {

    pulses: function( val ) {

    },

    focus: function( focusid ) {
      experiment.focus = focusid;
    }
  },


  run: function() {

    var self = experiment;
    var keithley = experiment.keithley,
      arduino = experiment.arduino;

    keithley.setDigioPin( 4, 1 );

    function *ivs() {

      var lightLevel = 0;

      while( true ) {

        arduino.setWhiteLightLevel( lightLevel );

        setTimeout( function() {
          experiment.next();
        }, 1000 );
        yield;

        var voltage;
        keithley.measureVoc( {
          channel: 'smub',
          current: 0.002, // +2mA current
          settlingTime: 1
        }).then( function( v ) {
          voltage = v;
          experiment.next();
        });
        yield;
      console.log( voltage );

        voltage = Math.max( voltage, 2 );

        keithley.sweepIV( {

          channel: 'smub',
          scanRate: 1,
          hysteresis: true,
          delay: 1,
          startV: voltage,
          stopV: -0.2

        }).then( function( iv ) {

            self.progress( "iv", [ iv, lightLevel ] );

            experiment.next();
        } );
        yield;

        if( lightLevel >= 13 ) {
          break;
        }

        if( lightLevel == 5 ) {
          lightLevel = 13;
        }

        lightLevel += 1;
      }
      arduino.setWhiteLightLevel( 13 );
      keithley.setDigioPin( 4, 0 );
    }

    experiment.iterator = new ivs();
    experiment.iterator.next();
  }
}


module.exports = experiment;
