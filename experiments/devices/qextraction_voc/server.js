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
	    app.getLogger().info("Starting charge extraction measurement ");

			
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

	      app.getLogger().info("Starting charge extraction measurement ");

	      var lightLevel = 0;

	      var results = {
	        vocs: [],
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
	        var yscale = 1e-3;
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


	  	   /*     app.getLogger().info("Pulsing dark... (Waiting time about " + ( ( config.timebase * 20 ) * config.blankaveraging ) + " s)");
		        pulseBlank(  ).then( function( w ) {
		          current.subtract( w[ 2 ] );
		          voltage.subtract( w[ 1 ] );
		          QExtr.next();
		        });
		        yield;
*/

		        current.shiftX( current.getXDeltaBetween( 0, 0.1 * recordLength ) );

		        if( horizontalscale == 1e-6 ) {
		        	index = false;
		        } else {
			        var index = current.findLevel( 8 * yscale, {
			        	box: 1,
			        	edge: 'descending',
			        	rounding: 'after',
			        	direction: 'ascending',
			        	rangeP: [ 0.1*recordLength, recordLength ]
			        } );

			        console.log( index );
			    }
		     
		        if( index ) {
		        	yscale *= 10;

		        	horizontalscale = Math.max( 1e-6, - current.getXDeltaBetween( 0.1 * recordLength, index ) / 3 );
		        	done = false;
   		  	        app.getLogger().info("Found overshoot at index " + index + ". New horizontal scale: " + horizontalscale + "s, vertical scale: " + yscale + "V");

		        } else {
		        	done = true;
		        }

				finalCurrent.push( current.subset( index || Math.round( 0.1 * recordLength ), time ? current.getIndexFromX( time ) : recordLength - 1 ), current.getIndexFromX( time ), time );
		        time = current.getXFromIndex( index );

				var voc = voltage.average( 0, 0.05 * recordLength );
	      }

	      	finalCurrent.sortX();
	      	var charges = finalCurrent.integrateP( 0, finalCurrent.getDataLength() - 1 );

		    results.vocs.push( voc );
		    results.charges.push( charges );
		    results.lightLevels.push( lightLevel );
		    results.currentWaves.push( finalCurrent );
		    results.voltageWaves.push( voltage );
		    results.lastCurrentWave = finalCurrent;
		    
		    progress( results );
	  }

	    oscilloscope.disableChannels();
	    resolver();

	}
	  function pulse( vscale ) {

	    var nb = config.averaging;

		oscilloscope.stopAquisition();
  	    oscilloscope.setVerticalScale( 2, vscale );	    
	    oscilloscope.clear();
	    oscilloscope.stopAfterSequence( true );
	    oscilloscope.setNbAverage( nb );
		PWSWhite.turnOn();
		oscilloscope.startAquisition();

		return app.wait( 1 ).then( function() {
			
			
			return app.wait( 2 ).then( function() {
				return oscilloscope.whenready( ).then( function() {

				  //	afg.disableChannels();
			    	return oscilloscope.getWaves();
			  });
			})
		})


	  }


	/*  function pulseBlank(  ) {

	    var nb = config.blankaveraging;

	    afg.disableChannels();
	    oscilloscope.setNbAverage( nb );
	    oscilloscope.clear();
	    oscilloscope.startAquisition();

	    afg.disableBurst( 1 );
	    afg.disableBurst( 2 );

	    afg.setPulseDelay( 2, 0 );
	    afg.setPulsePeriod( 2, config.timebase * 20 );
	    afg.setPulseWidth( 2, config.timebase * 10 );
	    afg.setShape( 1, "DC" );
	    afg.setVoltageOffset( 1, 0 );

	    afg.wait();
	    afg.enableChannels( );


	    return new Promise( function( resolver, rejecter ) {

	    	setTimeout( function() {
		  
				afg.enableChannels( );
			    oscilloscope.whenready().then( function() {

			      afg.enableBurst( 1 );
			      afg.enableBurst( 2 );
				
			      afg.disableChannels();
			      oscilloscope.getWaves().then( function( w ) {
			      	resolver( w );
			      });
			    } );

		      }, 2000 );


	    })
 		
	  }
*/
	  function setup() {

	    var nbAverage = config.averaging;
	    var pulsetime = config.pulsetime;
	    var delaytime = config.delaytime;
	    var timeBase = config.timebase;
	    var vscale = config.vscale;

	    keithley.command( "smub.source.offmode = smub.OUTPUT_HIGH_Z;" ); // The off mode of the Keithley should be high impedance
	    keithley.command( "smub.source.output = smub.OUTPUT_OFF;" ); // Turn the output off

	    oscilloscope.stopAfterSequence( true );

	    oscilloscope.disable50Ohms( 2 );
	    oscilloscope.disable50Ohms( 3 );
	    oscilloscope.disable50Ohms( 1 );
	    oscilloscope.disable50Ohms( 4 );
	    oscilloscope.setTriggerMode("NORMAL");

	    oscilloscope.setVerticalScale( 2, vscale ); // 200mV over channel 3
	    oscilloscope.setVerticalScale( 1, 300e-3 ); // 200mV over channel 3
	    oscilloscope.setVerticalScale( 4, 1 ); // 1V over channel 4
	    oscilloscope.setTriggerCoupling( "AC" ); // Trigger coupling should be AC

	    oscilloscope.setCoupling( 1, "DC");
	    oscilloscope.setCoupling( 2, "DC");
	    oscilloscope.setCoupling( 3, "DC");
	    oscilloscope.setCoupling( 4, "DC");

	    oscilloscope.setTriggerToChannel( 3 ); // Set trigger on switch channel
	    oscilloscope.setTriggerCoupling( "DC" ); // Trigger coupling should be AC
	    oscilloscope.setTriggerSlope( 4, "RISE"); // Trigger on bit going up
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



	    oscilloscope.setCursors( "VBArs" );
	    oscilloscope.setCursorsMode( "INDependent" );
	    oscilloscope.setCursorsSource( 2 );
	    oscilloscope.enableCursors( 2 );
	    oscilloscope.setVCursorsPosition( 2, timeBase * 7 );
	    oscilloscope.setVCursorsPosition( 1, 900e-9 ); // 5%
	    oscilloscope.setVCursorsPosition( 1, 900e-9 ); // 5%

	    oscilloscope.setMeasurementType( 1, "PK2PK" );
	    oscilloscope.setMeasurementSource( 1, 2 );
	    oscilloscope.enableMeasurement( 1 );
	    oscilloscope.setMeasurementGating( "OFF" );

	    oscilloscope.setMeasurementType( 2, "MINImum" );
	    oscilloscope.setMeasurementSource( 2, 2 );
	    oscilloscope.enableMeasurement( 2 );




	    /* AFG SETUP */

	    afg.disableChannels();

	    afg.setTriggerExternal(); // Only external trigger

	    var pulseChannel = 1;
	    afg.disableBurst( pulseChannel );
	    afg.setShape( pulseChannel, "PULSE" );
	    afg.setVoltageLow( pulseChannel, 0 );
	    afg.setVoltageHigh( pulseChannel, 4 );
	    afg.setPulseHold( pulseChannel , "WIDTH" );
	    afg.setPulseLeadingTime( pulseChannel, 9e-9 );
	    afg.setPulseTrailingTime( pulseChannel, 9e-9 );
	    afg.setPulseDelay( pulseChannel, 0 );
	    afg.setPulsePeriod( pulseChannel, ( pulsetime + delaytime ) + 1 );
	    afg.setPulseWidth( pulseChannel, pulsetime );

	    var pulseChannel = 2;
	    afg.disableBurst( pulseChannel );
	    afg.setShape( pulseChannel, "PULSE" );
	    afg.setPulseHold( pulseChannel , "WIDTH" );
	    afg.setVoltageLow( pulseChannel, 0 );
	    afg.setVoltageHigh( pulseChannel, 1.5 );
	    afg.setPulseLeadingTime( pulseChannel, 9e-9 );
	    afg.setPulseTrailingTime( pulseChannel, 9e-9 );
	    afg.setPulsePeriod( pulseChannel, ( pulsetime + delaytime ) + 1 );
	    afg.setPulseWidth( pulseChannel, delaytime );
		afg.setPulseDelay( pulseChannel, pulsetime );

	    afg.enableChannels( ); // Set the pin LOW
	    afg.alignPhases();
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

 		var fileName = app.save( "qextr_voc/", itx.getFile(), "itx" );


	  }

	   var QExtr = QExtr();
	   QExtr.next();




	});
	

};