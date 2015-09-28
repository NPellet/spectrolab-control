var app = require("app/app");


module.exports = function( config ) {

    
    var arduino = app.getInstrument('arduino-digio');
    var keithley = app.getInstrument('keithley-smu');

    function *iv( ) {

      var lights = config.lightLevels;
      var speeds = config.scanRates;
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

   var iv = iv();

   // Start the measurement
   iv.next();


  }

