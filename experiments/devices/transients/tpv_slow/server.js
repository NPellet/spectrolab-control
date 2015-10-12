var color = require("color");

module.exports = function( config, app ) {

	var keithley = app.getInstrument("KeithleySMU");
	var arduino = app.getInstrument("arduinoDigio");
	var afg = app.getInstrument("tektronix-functiongenerator");

	var PWSWhite = app.getInstrument("PowerSupplyWhiteLED");
	var PWSColor = app.getInstrument("PowerSupplyColoredLED");

	PWSColor.setCurrentLimit( 0.7 );
	PWSWhite.setCurrentLimit( 1 );
	arduino.routeLEDToArduino( "white" );

	var perturbationIteration = 0.1;
	var perturbationValue = PWSColor.getConfig().minVoltage; // 6V initi
		
	var timeperpoint;

	var c = color().hsl( 90, 100, 35 );
	var igorfile = app.itx();

	function progress( TPV, sunLevel ) {

		renderer.getModule( "tpv" ).newSerie( "tpv_" + sunLevel.sun, TPV, { lineColor: c.rgbString() } );
		renderer.getModule( "tpv" ).autoscale();

		var itxw = igorfile.newWave( "TPV_" + sunLevel.sun );
		itxw.setWaveform( TPV );

		c.rotate( 270 / 13 );

   		var fileName = app.save( "tpv_slow/", igorfile.getFile(), "itx" );
	}

	function setup() {

		/* AFG SETUP */
		afg.enableBurst( config.afgChannel );
		afg.setShape( config.afgChannel, "PULSE" );
		afg.setPulseHold( config.afgChannel, "WIDTH" );
		afg.setBurstTriggerDelay( config.afgChannel, 0 );
		afg.setBurstMode( config.afgChannel, "TRIGGERED");
		afg.setBurstNCycles( config.afgChannel, 1 );
		afg.setVoltageLow( config.afgChannel, 0 );
		afg.setVoltageHigh( config.afgChannel, 1.5 );
		afg.setPulseLeadingTime( config.afgChannel, 9e-9 );
		afg.setPulseTrailingTime( config.afgChannel, 9e-9 );
		afg.setPulseDelay( config.afgChannel, 0 );
		afg.setPulsePeriod( config.afgChannel, config.pulsewidth * 6 ); // Total time is 6x the pulse width
		afg.setPulseWidth( config.afgChannel, config.pulsewidth );
		afg.disableChannels( ); // Set the pin LOW
		afg.getErrors();

		afg.disableBurst( config.afgChannel );

 	 	return app.ready( keithley, arduino, afg, PWSWhite, PWSColor );
	}

	return new Promise( function( resolver, rejecter ) {

		function *tpv() {

			setup().then( function() {
				method.next();
			});

			yield;

			var i = 0,
				TPV,
				levels = app.getConfig().instruments.PowerSupplyWhiteLED.voltage_sunoutput;

			app.getLogger().info("Routing DC White LED to Arduino.")
			app.getLogger().info("Routing DC Colored LED to AFG.")

			arduino.turnLEDOn("white");
			arduino.routeLEDToAFG( config.pulseColor, config.afgChannel );
			
			while( true ) {

				
				Promise.all( [ PWSWhite.setVoltageLimit( levels[ i ].voltage ), PWSWhite.turnOn(), PWSColor.turnOn(), afg.enableChannel( 1 ) ] ).then( function() {
					
					app.getLogger().info("Setting current to white LED. Voltage: " + levels[ i ].voltage + "V. Sun intensity: " + levels[ i ].text );

					perturbation( ).then( function( d ) {
						TPV = d;
						method.next();
					} );

				} );

				yield;
				
				TPV.subtract( TPV.getValue( 0 ) );
				TPV.divideBy( TPV.getMax() );
				TPV.shiftX( - config.pulsewidth );

				progress( TPV, levels[ i ] );

				i++;

				if( i == levels.length ) {
					break;
				}
			}

			
			afg.disableChannels(); // Turn off function generator

			arduino.turnLEDOff("white"); // Turn off white LEDs

			resolver(); // Done !
		};


		// Applicable with jsc and voc
		function perturbation(  ) {

			var self = this;
			var level = 4e-3;

			timeperpoint = timeperpoint || config.pulsewidth * 5 / nbpoints;

			return new Promise( function( resolver, rejecter ) {
				
				var perturbed = 0;

				function *perturbator() {

					var perturbed = 0;
					var nbpoints = 2000; // Fixed number of point. Now the question is the delay between every point ?
					
					PWSColor.setVoltageLimit( perturbationValue );

					while( true ) {

						if( perturbed < level && perturbationValue < 15 ) {

							if( perturbed > 0 ) {
								app.getLogger().info( "Perturbation is not strong enough (" + perturbed + "V vs " + level + "V required). Ramping voltage up to " + ( perturbationValue + perturbationIteration )  );
								perturbationValue += perturbationIteration;
							}


							keithley.tpv( {

								channel: "smub",
								npoints: nbpoints,
								ncycles: config.trialaveraging,
								delaybetweenpoints: timeperpoint // Length is 5 times the pulse width

							} ).then( function( w ) {

								perturbed = Math.abs( w.getMax() - w.getMin() );

							} );
	
						} else {


							keithley.tpv( {

								channel: "smub",
								npoints: nbpoints,
								ncycles: config.averaging,
								delaybetweenpoints: timeperpoint

							} ).then( function( w ) {

								var decaytime = w.findLevel( {

									level: 0.3,
									edge: "descending",
									rangeP: [ ]
								} );

								if( ! decaytime ) {

									decaytime = w.getXAtPos( nbpoints - 1 );

								} else {

									decaytime = w.getXAtPos( decaytime );
								}

								decaytime -= config.pulsewidth;
								decaytime *= 3; // We want to see 3 times longer than the fittable decay time

								timeperpoint = ( decaytime + config.pulsewidth ) / nbpoints - 16e-3; // Divide by the number of points and subtract the measurement time

								if( timeperpoint < 0 ) {
									timeperpoint = 0;
								}

								resolver( w );
							} );
						}
					}
				}

				var pert = perturbator();
				pert.next();
			});
		}


		var method = tpv();
		method.next();
	});

};