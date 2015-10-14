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

	    var recordLength = 10000;
	    var yscales = {};

	    setup();

	    function *QExtr(  ) {

	      oscilloscope.setRecordLength( recordLength );

	      setTimeout( function() {
	      	QExtr.next();
	      }, 2000 );

	      yield;

	      app.getLogger().info("Starting charge extraction measurement at jsc ");

	      var lightLevel = 0;

	      var results = {
	        jscs: [],
	        charges: [],
	        lightLevels: [],
	        currentWaves: [],
	        voltageWaves: []
	      };

	      var current, voltage;

	      var voltagesun = app.getConfig().instruments.PowerSupplyWhiteLED.voltage_sunoutput;

	      for( var lightLevel = voltagesun.length - 1; lightLevel >= 0; lightLevel -- ) {

	        PWSWhite.setVoltageLimit( voltagesun[ lightLevel ].voltage );
			app.getLogger().info("Using bias light intensity: " + voltagesun[ lightLevel ].text );

	        yscales[ lightLevel ] = yscales[ lightLevel ] || yscales[ lightLevel - 1 ] || config.vscale;

	        var breakit = false;

	        oscilloscope.setOffset( 2, 0 );


	        var done = false;
	        var horizontalscale = config.timebase;

	        var inityscale = 80e-3;
	        var yscale = config.vscale;

	        var finalCurrent = new Waveform();
	        var time = false;

	        while( ! done ) {

    		    oscilloscope.setHorizontalScale( Math.round( horizontalscale * Math.pow( 10, 6 ) ) / Math.pow( 10, 6 ) );

	   	        app.ready( keithley, arduino, afg, oscilloscope, PWSWhite, PWSColor ).then( function() {
	   	        	QExtr.next();
	   	        });
	   	        yield;

	   	        app.getLogger().info("Pulsing with horizontale timescale of: " + horizontalscale + "s and vertical scale " + yscale + "V... (Waiting time about " + ( ( config.pulsetime + config.delaytime ) + 1 ) * config.averaging + " s)");

		        pulse( yscale ).then( function( w ) {
		          	app.getLogger().info("Pulsing done");
	                current = w[ 2 ];
	                voltage = w[ 1 ];
					QExtr.next();
		        } );
		        yield;


	  	        app.getLogger().info("Pulsing dark... (Waiting time about " + ( ( config.timebase * 20 ) * config.blankaveraging ) + " s)");
		        pulseBlank(  ).then( function( w ) {
		          current.subtract( w[ 2 ] );
		          voltage.subtract( w[ 1 ] );
		          QExtr.next();
		        });
		        yield;

   				var jsc = current.average( recordLength * 0.09, recordLength * 0.1 );
				var charges = current.integrateP( Math.round( 0.1 * recordLength ), recordLength - 1 );

				if( jsc < yscale / 3 ) {
					yscale /= 2
					continue;
				} else {
					yscale = inityscale;
				}
	      }

      	
	    results.jscs.push( jscs );
	    results.charges.push( charges );
	    results.lightLevels.push( lightLevel );
	    results.currentWaves.push( current );
	    results.voltageWaves.push( voltage );
	    results.lastCurrentWave = current;
	    
	    progress( results );
	  }

	    oscilloscope.disableChannels();


	}

	function pulse( vscale, nb ) {
		
	    oscilloscope.setNbAverage( nb );
	    oscilloscope.clear();
	    oscilloscope.setTriggerMode("NORMAL");
	    oscilloscope.stopAfterSequence( true );
	    afg.setBurstNCycles( 1, nb );

	    oscilloscope.setVerticalScale( 3, vscale );
	    oscilloscope.startAquisition();

	    return new Promise( function( resolver ) {

		    setTimeout( function() {

		      afg.enableChannels( );
		      afg.trigger();

		      oscilloscope.whenready( ).then( function() {
			  	afg.disableChannels();
		    	oscilloscope.getWaves().then( function( w ) {
		    		resolver( w );
		    	});
			  });

		    }, 2000 );

		});
	  }


	  function pulseBlank( nb ) {

	    var nb = config.blankaveraging;
		var self = experiment;
    	oscilloscope.setTriggerMode("AUTO");
    	oscilloscope.stopAfterSequence( false );
		oscilloscope.setNbAverage( nb );
		oscilloscope.setHorizontalScale( config.timebase );
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
	    oscilloscope.disable50Ohms( 1 );
	    oscilloscope.disable50Ohms( 4 );

	    oscilloscope.setHorizontalScale( timeBase );
	    oscilloscope.setVerticalScale( 3, vscale ); // 200mV over channel 3
	    oscilloscope.setVerticalScale( 4, 1 ); // 1V over channel 4

	    oscilloscope.setTriggerCoupling( "AC" ); // Trigger coupling should be AC

	    oscilloscope.setCoupling( 1, "DC");
	    oscilloscope.setCoupling( 2, "DC");
	    oscilloscope.setCoupling( 3, "DC");
	    oscilloscope.setCoupling( 4, "DC");

	    oscilloscope.setTriggerToChannel( 1 ); // Set trigger on switch channel
	    oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be AC
	    oscilloscope.setTriggerSlope( 4, "FALL"); // Trigger on bit going up
	    oscilloscope.setTriggerRefPoint( 10 ); // Set pre-trigger, 10%
	    oscilloscope.setTriggerLevel( 0.7 ); // Set trigger to 0.7V

	    oscilloscope.enableChannels();

	    oscilloscope.setPosition( 2, -4 );
	    oscilloscope.setPosition( 3, -4 );
	    oscilloscope.setPosition( 1, 0 );
	    oscilloscope.setPosition( 4, 0 );

	    oscilloscope.setOffset( 1, 0 );
	    oscilloscope.setOffset( 2, 0 );
	    oscilloscope.setOffset( 3, 0 );
	    oscilloscope.setOffset( 4, 0 );

	    oscilloscope.enableAveraging();
	    oscilloscope.disableCursors( );

	    oscilloscope.setMeasurementType( 1, "AMPlitude" );
	    oscilloscope.setMeasurementSource( 1, 3 );
	    oscilloscope.enableMeasurement( 1 );
	    oscilloscope.setMeasurementGating( "OFF" );


	    /* AFG SETUP */

	    afg.setTriggerExternal(); // Only external trigger

	    var pulseChannel = 1;
	    afg.enableBurst( pulseChannel );
	    afg.setShape( pulseChannel, "PULSE" );
	    afg.setPulseHold( pulseChannel , "WIDTH" );
	    afg.setBurstTriggerDelay(  pulseChannel, 0 );
	    afg.setBurstNCycles( pulseChannel, nbAverage );
	    afg.setVoltageLow( pulseChannel, 0 );
	    afg.setVoltageHigh( pulseChannel, 1.5 );
	    afg.setPulseLeadingTime( pulseChannel, 9e-9 );
	    afg.setPulseTrailingTime( pulseChannel, 9e-9 );
	    afg.setPulseDelay( pulseChannel, 0 );
	    afg.setPulsePeriod( pulseChannel, ( pulsetime + delaytime ) + 1 );
	    afg.setPulseWidth( pulseChannel, pulsetime );

	    afg.setShape( 2, "DC" );
	    afg.setVoltageOffset( 2, 0 );

	    keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
	    keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off

	    afg.disableChannels( ); // Set the pin LOW

	    afg.getErrors();


	    return app.ready( keithley, arduino, afg, oscilloscope, PWSWhite, PWSColor );
	  }


	  function progress( arg ) {

  		var itx = app.itx();
		var qvoc = new Waveform();

		var itxw = itx.newWave( "lightLevels" );
		itxw.setWaveform( arg.lightLevels );

		var itxw = itx.newWave( "charges" );
		itxw.setWaveform( arg.charges );

		var itxw = itx.newWave( "vocs" );
		itxw.setWaveform( arg.vocs );

		for( var i = 0; i < arg.lightLevels.length; i ++ ) {
			qvoc.push( arg.charges[ i ], arg.vocs[ i ] );

			var itxw = itx.newWave( "current_" + i );
			itxw.setWaveform( arg.currentWaves[ i ] );

			var itxw = itx.newWave( "voltage_" + i );
			itxw.setWaveform( arg.voltageWaves[ i ] );
		}

		renderer.getModule( "graph" ).newScatterSerie( "qvoc", qvoc );
		renderer.getModule( "lastqextr" ).newSerie( "qextr", arg.lastCurrentWave );

 		var fileName = app.save( "qextr_voc/", itx.getFile(), app.getDeviceName(), "itx" );


	  }

	   var QExtr = QExtr();
	   QExtr.next();




	});
	

};