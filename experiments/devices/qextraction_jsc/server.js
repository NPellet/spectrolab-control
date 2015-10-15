var color = require("color");
var Waveform = require("../../../app/waveform");

module.exports = function( config, app ) {

	var keithley = app.getInstrument("KeithleySMU");
	var arduino = app.getInstrument("arduinoDigio");
	var oscilloscope = app.getInstrument("tektronix-oscilloscope");
	var afg = app.getInstrument("tektronix-functiongenerator");

	var PWSWhite = app.getInstrument("PowerSupplyWhiteLED");
	var PWSColor = app.getInstrument("PowerSupplyColoredLED");
	

	return new Promise( function( resolver, rejecter ) {

	    app.getLogger().info("Starting charge extraction experiment at 50 Ohm load");
	
		config.pulsetime = parseFloat( config.pulsetime );
		config.delaytime = parseFloat( config.delaytime );
		config.timebase = parseFloat( config.timebase ) * 1e-6;

		PWSWhite.setCurrentLimit( 1 );

		PWSWhite.turnOn();
		PWSColor.turnOff();

		arduino.routeLEDToAFG( "white" );

	    var recordLength = 100000;
	    var yscales = {};


	    function *QExtr(  ) {

	      oscilloscope.setRecordLength( recordLength );


	      setup().then( function() {
	      	QExtr.next();
	      });

	      yield;

	      app.getLogger().info("Starting charge extraction measurement at jsc ");

	      var lightLevel = 0;

	      var results = {
	        jscs: [],
	        charges: [],
	        lightLevels: [],
	        currentWaves: [],
	      };

	      var current, voltage;

	      var voltagesun = app.getConfig().instruments.PowerSupplyWhiteLED.voltage_sunoutput;

        var inityscale = 80e-3;
        var yscale = inityscale;

	      for( var lightLevel = voltagesun.length - 1; lightLevel >= 0; lightLevel -- ) {

	        PWSWhite.setVoltageLimit( voltagesun[ lightLevel ].voltage );
			app.getLogger().info("Using bias light intensity: " + voltagesun[ lightLevel ].text );

	        yscales[ lightLevel ] = yscales[ lightLevel ] || yscales[ lightLevel - 1 ] || config.vscale;

	        var breakit = false;

	        oscilloscope.setOffset( 2, 0 );


	        var done = false;
	        var horizontalscale = config.timebase;


	        var finalCurrent = new Waveform();
	        var time = false;

	        while( ! done ) {

    		    oscilloscope.setHorizontalScale( Math.round( horizontalscale * Math.pow( 10, 6 ) ) / Math.pow( 10, 6 ) );

	   	        app.ready( arduino, afg, oscilloscope, PWSWhite, PWSColor ).then( function() {
	   	        	QExtr.next();
	   	        });
	   	        yield;

	   	        app.getLogger().info("Pulsing with horizontale timescale of: " + horizontalscale + "s and vertical scale " + yscale + "V... (Waiting time about " + ( ( config.pulsetime + config.delaytime ) + 1 ) * config.averaging + " s)");

		        pulse( yscale, config.averaging ).then( function( w ) {
		          	app.getLogger().info("Pulsing done");
	                current = w[ 1 ];
					QExtr.next();
		        } );
		        yield;


	  	        app.getLogger().info("Pulsing dark... (Waiting time about 10s)");
		        pulseBlank(  ).then( function( w ) {
		          current.subtract( w[ 1 ] );
		          QExtr.next();
		        });
		        yield;

   				var jsc = current.average( recordLength * 0.09, recordLength * 0.1 );
				var charges = current.integrateP( Math.round( 0.1 * recordLength ), recordLength - 1 );

				if( jsc * 3 < yscale * 8 && yscale > 1e-3 ) {
					yscale /= 2
					done = false;
					continue;
				} else {
				//	yscale = inityscale;
					done = true;
				}
	      }

      	
	    results.jscs.push( jsc );
	    results.charges.push( charges );
	    results.lightLevels.push( lightLevel );
	    results.currentWaves.push( current );
	    results.lastCurrentWave = current;
	    
	    progress( results );
	  }

	    oscilloscope.disableChannels();
resolver();

	}

	function pulse( vscale, nb ) {
		
	    oscilloscope.setNbAverage( nb );
	    oscilloscope.clear();
	    oscilloscope.setTriggerMode("NORMAL");
	    oscilloscope.stopAfterSequence( true );
	    oscilloscope.setVerticalScale( 1, vscale );

		PWSWhite.turnOn();
	    afg.enableChannels( );
		
		return app.wait( 1 ).then( function() {

			oscilloscope.clear();
			oscilloscope.startAquisition();

			return app.wait( 2 ).then( function() {
				return oscilloscope.whenready( ).then( function() {

				  	afg.disableChannels();
			    	return oscilloscope.getWaves();
			  });
			})
		})

	   
	  }


	  function pulseBlank( nb ) {

		PWSWhite.turnOff();

		oscilloscope.setTriggerMode("AUTO");
    	oscilloscope.stopAfterSequence( false );
		oscilloscope.setNbAverage( 1000 );
		oscilloscope.clear();
		oscilloscope.startAquisition();
		
		return app.wait( 10 ).then( function() {
			return oscilloscope.getWaves();
		})
	  }

	  function setup() {

	   var nbAverage = config.averaging;
	    var pulsetime = config.pulsetime;
	    var delaytime = config.delaytime;
	    var timeBase = config.timebase;
	    var vscale = config.vscale;

	    oscilloscope.setTriggerMode("AUTO");
	    oscilloscope.stopAfterSequence( false );


	    oscilloscope.disable50Ohms( 2 );
	    oscilloscope.enable50Ohms( 3 );
	    oscilloscope.enable50Ohms( 1 );
	    oscilloscope.disable50Ohms( 4 );

	    oscilloscope.setHorizontalScale( timeBase );
	    oscilloscope.setVerticalScale( 1, vscale ); // 200mV over channel 3
	    oscilloscope.setVerticalScale( 4, 1 ); // 1V over channel 4

	    oscilloscope.setTriggerCoupling( "AC" ); // Trigger coupling should be AC

	    oscilloscope.setCoupling( 1, "DC");
	    oscilloscope.setCoupling( 2, "DC");
	    oscilloscope.setCoupling( 3, "DC");
	    oscilloscope.setCoupling( 4, "DC");

	    oscilloscope.setTriggerToChannel( 4 ); // Set trigger on switch channel
	    oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be AC
	    oscilloscope.setTriggerSlope( 4, "FALL"); // Trigger on bit going up
	    oscilloscope.setTriggerRefPoint( 10 ); // Set pre-trigger, 10%
	    oscilloscope.setTriggerLevel( 0.7 ); // Set trigger to 0.7V

	    oscilloscope.enableChannels();

	    oscilloscope.setPosition( 2, -4 );
	    oscilloscope.setPosition( 1, -4 );
	    oscilloscope.setPosition( 3, 0 );
	    oscilloscope.setPosition( 4, 0 );

	    oscilloscope.setOffset( 1, 0 );
	    oscilloscope.setOffset( 2, 0 );
	    oscilloscope.setOffset( 3, 0 );
	    oscilloscope.setOffset( 4, 0 );

	    oscilloscope.enableAveraging();
	    oscilloscope.disableCursors( );

	    oscilloscope.setMeasurementType( 1, "AMPlitude" );
	    oscilloscope.setMeasurementSource( 1, 1 );
	    oscilloscope.enableMeasurement( 1 );
	    oscilloscope.setMeasurementGating( "OFF" );


	    /* AFG SETUP */

	    afg.setTriggerExternal(); // Only external trigger

	    var pulseChannel = 1;
	    afg.disableBurst( pulseChannel );
	    afg.setShape( pulseChannel, "PULSE" );
	    afg.setPulseHold( pulseChannel , "WIDTH" );
	    afg.setVoltageLow( pulseChannel, 0 );
	    afg.setVoltageHigh( pulseChannel, 1.5 );
	    afg.setPulseLeadingTime( pulseChannel, 9e-9 );
	    afg.setPulseTrailingTime( pulseChannel, 9e-9 );
	    afg.setPulseDelay( pulseChannel, 0 );
	    afg.setPulsePeriod( pulseChannel, ( pulsetime + delaytime ) + 1 );
	    afg.setPulseWidth( pulseChannel, pulsetime );

	    afg.setShape( 2, "DC" );
	    afg.setVoltageOffset( 2, 0 );

	//    keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;", { waitForResponse: false } ); // The off mode of the Keithley should be high impedance
	 //   keithley.command( "smub.source.output = smub.OUTPUT_OFF;", { waitForResponse: false } ); // Turn the output off

	    afg.disableChannels( ); // Set the pin LOW

	    afg.getErrors();


	    return app.ready( arduino, afg, oscilloscope, PWSWhite, PWSColor );
	  }


	  function progress( arg ) {

  		var itx = app.itx();
		var qjscs = new Waveform();

		var itxw = itx.newWave( "lightLevels" );
		itxw.setWaveform( arg.lightLevels );

		var itxw = itx.newWave( "charges" );
		itxw.setWaveform( arg.charges );

		var itxw = itx.newWave( "jscs" );
		itxw.setWaveform( arg.jscs );

		for( var i = 0; i < arg.lightLevels.length; i ++ ) {
			qjscs.push( arg.charges[ i ], arg.jscs[ i ] );

			var itxw = itx.newWave( "current_" + i );
			itxw.setWaveform( arg.currentWaves[ i ] );
		}

		renderer.getModule( "graph" ).newScatterSerie( "qvoc", qjscs );
		renderer.getModule( "lastqextr" ).newSerie( "qextr", arg.lastCurrentWave );

 		var fileName = app.save( "qextr_jsc/", itx.getFile(), "itx" );


	  }

	   var QExtr = QExtr();
	   QExtr.next();




	});
	

};