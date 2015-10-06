
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
      lights = [ -1]
      for( var light = 0, llights = lights.length; light < llights; light ++ ) {

        keithley.writeDigio( 4, 1 );

        if( 1 == 2 ) {
          if( light < 0 ) {
            arduino.whiteLightOff();
          } else {
            arduino.setWhiteLightLevel( lights[ light ] );
          }
        }

        setTimeout( function() {
          self.loopNext();
        }, 1000 );
        yield;


        self.config.forcevstart = true;
        self.config.forcevend = true;
        self.config.vstart = 0
        self.config.vstart = 0

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

        speeds = [ 0.1 ]
        var ends = [10]

        for( var end = 0, lends = ends.length; end < lends; end ++ ) {

            for( var speed = 0, lspeeds = speeds.length; speed < lspeeds; speed ++ ) {
              
              self.config.vend = ends[ end ];


              keithley.sweepIV( {

                channel: 'smub',
                startV: voltage,
                stopV1: self.config.forcevend ? self.config.vend : -voltage,
                stopV2: - ( self.config.forcevend ? self.config.vend : -voltage ),
                stepV: 0.01,
                scanRate: speeds[ speed ],
                timeDelay: 5,
                cycles: 3
                
              }).then( function( iv ) {

                  self.progress( "iv", {

                    iv: iv,
                    scanRate: speeds[ speed ],
                    lightLevel: lights[ light ],
                    endvoltage: ends[ end ]

                  } );

                  self.loopNext();
              } );

              yield;
            }
          }


        }
      
    }

  }
});


module.exports = experiment;
