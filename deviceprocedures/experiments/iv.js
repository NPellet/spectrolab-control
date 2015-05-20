
/**
 *  Measures IV at different scans, different speeds
 *  Author: Norman Pellet
 *  Date: Mai 19, 2015
 */

var defaultExperiment = require("../experiment"),
  extend = require("extend");

var keithley, arduino;

var experiment = function() {};
experiment.prototype = new defaultExperiment();



extend( experiment.prototype, { 

  defaults: {
    lights: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ],
    speeds: [ 1, 0.1, 0.01 ]
  },

  init: function( parameters ) {
    experiment.parameters = parameters;
    keithley = parameters.instruments["keithley-smu"].instrument;
    arduino = parameters.instruments.arduino.instrument;
  },

  makeLoop: function() {

    var self = this;

    return function *iv( ) {

      var lights = experiment.config.lightlevels;
      var speeds = experiment.config.scanrates;
      var voltage;

      for( var light = 0, llights = lights.length; light < llights; light ++ ) {

        arduino.setWhiteLightLevel( lights[ light ] );

        setTimeout( function() {
          experiment.next();
        }, 1000 );
        yield;

        keithley.measureVoc( {
          channel: 'smub',
          current: 0.002, // +2mA current
          settlingTime: 1
        }).then( function( v ) {
          voltage = v;
          experiment.next();
        });
        yield;

        voltage = Math.max( voltage, 2 );

        for( var speed = 0, lspeeds = speeds.length; speed < lspeeds; speed ++ ) {

          keithley.sweepIV( {

            channel: 'smub',
            scanRate: speeds[ speed ],
            hysteresis: true,
            delay: 1,
            startV: voltage,
            stopV: -0.2

          }).then( function( iv ) {

              experiment.progress( "iv", {

                iv: iv,
                scanRate: speeds[ speed ],
                lightLevel: arduino.getLightLevel( lights[ light ] )

              } );

              experiment.next();
          } );

          yield;
        }
      }
    }

  }
});


module.exports = experiment;
