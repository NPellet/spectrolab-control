
module.exports = function( config, app ) {

    var arduino = app.getInstrument('arduinoDigio');
    var keithley = app.getInstrument('KeithleySMU');
    var pws = app.getInstrument("PWSWhiteLight");
    
    arduino.routeLEDToArduino( "white" );


      var lights = config.lightLevels;
      var speeds = config.scanRates;
      var voltage;


    function *iv( ) {


      if( config.measureDark ) {
        lights.unshift( -1 );
      }

      for( var lightLevel = 0, l = lights.length; lightLevel < l; lightLevel ++ ) {

        if( lightLevel < 0 ) {
          arduino.turnLightOff( "white" );
        } else {
          arduino.turnLightOff( "white" );
          pws.setCurrentLimit( app.getConfig().instruments.PWSWhiteLight.current_sunoutput[ lightLevel ] );
        }


        setTimeout( function() {
          iv.next();
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
            
            iv.next();
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

              progressIV( iv, lightLevel );

              iv.next();
          } );

          yield;
        }
      }
   }

   var iv = iv();
   iv.next();

   var igorfile = app.itx();

   function progressIV( iv, lightLevel ) {

        var itxw = igorfile.newWave( "iv_" + lightLevel );
        itxw.setWaveform( iv );

        var fileName = app.save( "iv", itx.getFile(), app.getDeviceName(), "itx" );

        //app.getRenderer().getModule("IV")
   }
}
  