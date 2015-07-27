
/**
 *  Measures IV at different scans, different speeds
 *  Author: Norman Pellet
 *  Date: Mai 19, 2015
 */

var defaultExperiment = require("../experiment"),
  extend = require("extend");

var keithley, arduino;

var experiment = function() {
  this._init();
};
experiment.prototype = new defaultExperiment();



extend( experiment.prototype, {

  defaults: {
    lightLevels: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ],
    scanRates: [ 1, 0.1, 0.01 ],
    vstart: 1,
    vend: -0.2,
    forcevstart: false,
    forcevend: false
  },

  init: function( parameters ) {

    keithley = this.getInstrument("keithley");
    arduino = this.getInstrument("arduino");
  },

  makeLoop: function() {

    var self = this;

    return function *iv( ) {

      var lights = self.config.lightLevels;
      var speeds = self.config.scanRates;
      var voltage;

      for( var light = 0, llights = lights.length; light < llights; light ++ ) {

        keithley.writeDigio( 4, 1 );

        if( light < 0 ) {
          arduino.whiteLightOff();
        } else {
          arduino.setWhiteLightLevel( lights[ light ] );
        }

        setTimeout( function() {
          self.loopNext();
        }, 1000 );
        yield;


        if( self.config.forcevstart ) {

          voltage = Math.min( self.config.vstart, 2 );
        } else {

          keithley.measureVoc( {
            channel: 'smub',
            current: 0.002, // +2mA current
            settlingTime: 1
          }).then( function( v ) {
            voltage = v;
            self.loopNext();
          });
          yield;

          voltage = Math.max( 0.2, Math.min( voltage, 2 ) );
        }
        for( var speed = 0, lspeeds = speeds.length; speed < lspeeds; speed ++ ) {
          keithley.sweepIV( {

            channel: 'smub',
            scanRate: speeds[ speed ],
            hysteresis: true,
            timeDelay: 5,
            startV: voltage,
            stopV: self.config.forcevend ? self.config.vend : -voltage

          }).then( function( iv ) {

              self.progress( "iv", {

                iv: iv,
                scanRate: speeds[ speed ],
                lightLevel: lights[ light ]

              } );

              self.loopNext();
          } );

          yield;
        }
      }
    }

  }
});


module.exports = experiment;
