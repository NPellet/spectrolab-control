var color = require("color");

module.exports = function( config, app ) {

	var keithley = app.getInstrument("KeithleySMU");
	var arduino = app.getInstrument("arduinoDigio");
	var afg = app.getInstrument("tektronix-functiongenerator");

	var PWSWhite = app.getInstrument("PowerSupplyWhiteLED");
	var PWSColor = app.getInstrument("PowerSupplyColoredLED");


	var nbpoints = 300; // Fixed number of point. Now the question is the delay between every point ?

	var perturbationIteration = 0.15;
	var perturbationValue = PWSColor.getConfig().minVoltage; // 6V initi
	console.log( config );

	var nplc = false;

	function calculateNPLC( decaytime, nbpoints ) {
		// time per point
		var timeperpoint = ( decaytime ) / nbpoints;
		var nplc = timeperpoint / 16e-3;


		nplc = Math.round( nplc * 500 ) / 500;
console.log(nplc);
		if( nplc < 0.001 ) {
			nplc = 0.001;
		}

		if( nplc > 0.02 ) {
			nplc = 0.02;
		}

		return nplc;
	}

	function nplcFromWave( wave, level ) {

		var decaytime = wave.findLevel( level, {
			rounding: 'after',
        	direction: 'ascending',
			edge: "descending",
			rangeP: [ 0, wave.getDataLength() - 1 ]
		} );

		console.log("Found decay time:" + decaytime );

		if( ! decaytime || decaytime > wave.getDataLength() - 1 ) {
			decaytime = wave.getXFromIndex( wave.getDataLength() - 1 );
		} else {
			decaytime = wave.getXFromIndex( decaytime );
		}
		
		decaytime *= 5; // We want to see 3 times longer than the fittable decay time
console.log( Math.min( config.pulsewidth * 16, decaytime ), decaytime );

		return calculateNPLC( Math.min( config.pulsewidth * 16, decaytime ), nbpoints );
	}


	var c = color().hsl( 90, 100, 35 );
	var igorfile = app.itx();

	function progress( TPC, sunLevel ) {

		renderer.getModule( "tpc" ).newSerie( "tpc_" + sunLevel.sun, TPC, { lineColor: c.rgbString() } );
		renderer.getModule( "tpc" ).autoscale();

		var itxw = igorfile.newWave( "TPC_" + sunLevel.sun );
		itxw.setWaveform( TPC );

		c.rotate( 270 / 13 );

   		var fileName = app.save( "tpc_slow/", igorfile.getFile(), "itx" );
	}

	function setup() {
		config.afgChannel = "A";
		/* AFG SETUP */

		keithley.connect();
		arduino.connect();
		
		PWSColor.setCurrentLimit( 0.7 );
		PWSWhite.setCurrentLimit( 1 );
		arduino.routeLEDToArduino( "White" );

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
		afg.setPulsePeriod( config.afgChannel, config.pulsewidth * 21 ); // Total time is 6x the pulse width
		afg.setPulseWidth( config.afgChannel, config.pulsewidth );
		afg.disableChannels( ); // Set the pin LOW
		afg.getErrors();

		afg.disableBurst( config.afgChannel );

 	 	return app.ready( keithley, arduino, afg, PWSWhite, PWSColor );
	}

	return new Promise( function( resolver, rejecter ) {

		function *tpc() {

			setup().then( function() {
				method.next();
			});



			yield;

			var i = 0,
				TPC,
				levels = app.getConfig().instruments.PowerSupplyWhiteLED.voltage_sunoutput;

			app.getLogger().info("Routing DC White LED to Arduino.")
			app.getLogger().info("Routing DC Colored LED to AFG.")

			arduino.turnLEDOn("white");

			config.pulseColor = 'red';
			arduino.routeLEDToAFG( config.pulseColor, config.afgChannel );
			
			while( true ) {

				
				Promise.all( [ PWSWhite.setVoltageLimit( levels[ i ].voltage ), PWSWhite.turnOn(), PWSColor.turnOn(), afg.enableChannel( 1 ) ] ).then( function() {
					
					app.getLogger().info("Setting current to white LED. Voltage: " + levels[ i ].voltage + "V. Sun intensity: " + levels[ i ].text );

					perturbation( i == 0 ).then( function( d ) {
						TPC = d;
						method.next();
					} );

				} );

				yield;

				
				progress( TPC, levels[ i ] );

				i++;

				if( i >= levels.length ) {
					break;
				}
			}

			
			afg.disableChannels(); // Turn off function generator

			arduino.turnLEDOff("white"); // Turn off white LEDs
			PWSColor.turnOff(); // Turn off white LEDs
			PWSWhite.turnOff();
			resolver(); // Done !
		};


		// Applicable with jsc and voc
		function perturbation( skipFirst ) {

			var self = this;
			var level = 1e-6; // 1mV over 50 Ohm
			var i = 0;
			var current = -1;

			return new Promise( function( resolver, rejecter ) {
				
				var perturbed = 0;

				function *perturbator() {

					var perturbed = 0;
					perturbationValue -= perturbationIteration / 2;
					PWSColor.setVoltageLimit( perturbationValue );

					setTimeout( function() {
						pert.next();
					}, 2000 );
					yield;

					while( true ) {

						if( current != -1 ) {
							current = Math.max( 1e-7, current < 2e-6 ? current / 20 : current / 10 );
							app.getLogger().info( "Perturbation :" + perturbed + "A. Required:" + current + "A" );
						}
						

						if( perturbed < current && perturbationValue < 15 || current == -1 ) {

							PWSColor.setVoltageLimit( perturbationValue );
							setTimeout( function() {
								pert.next();
							}, 1000 );
							yield;
							

							if( perturbed > 0 ) {

								app.getLogger().info( "Perturbation is not strong enough (" + perturbed + "A vs " + current + "A required). Ramping voltage up to " + ( perturbationValue + perturbationIteration )  );
								perturbationValue += perturbationIteration;
							}

							//keithley.getErrors();

							//timeperpoint = Math.max( 50e-6, timeperpoint );
							keithley.tpc( {

								channel: "smub",
								npoints: nbpoints,
								ncycles: config.trialaveraging,
								nplc: calculateNPLC( config.pulsewidth * 10, nbpoints ), // Length is 5 times the pulse width
								delay: 0

							} ).then( function( w ) {

								current = - w.current;
								perturbed = Math.abs( w.wave.getMax() - w.wave.getMin() );
								console.log("PERTURBED: " + perturbed + "; Current: " + current );

								if( isNaN( perturbed ) ) {
									perturbed = 0;
								}

								if( skipFirst && i == 0 ) {
									perturbed = 0;
								}

								renderer.getModule( "tpctemp" ).newSerie( "tpc_temp", w.wave, { lineColor: 'grey' } );
								renderer.getModule( "tpctemp" ).autoscale();


								pert.next();	
								
							} );
	
						} else {
					
							if( ! nplc ) {

								keithley.tpc( {

									channel: "smub",
									npoints: nbpoints,
									ncycles: Math.round( config.averaging / 3 ),
									nplc: calculateNPLC( config.pulsewidth * 16, nbpoints ),
									delay: config.pulsewidth

								} ).then( function( w ) {

									w = w.wave;
									w.divideBy( -1 );
									w.subtract( w.getValueAt( w.getDataLength() - 1 ) );
									w.divideBy( w.getMax() );
								//	w.shiftX( - config.pulsewidth );

									renderer.getModule( "tpctemp" ).newSerie( "tpc_temp", w, { lineColor: 'grey' } );
									renderer.getModule( "tpctemp" ).autoscale();

									nplc = nplcFromWave( w, 0.1 );
									pert.next();
								} );

								yield;

							}

							keithley.tpc( {

								channel: "smub",
								npoints: nbpoints,
								ncycles: config.averaging,
								nplc: nplc,
								delay: config.pulsewidth

							} ).then( function( w ) {

								w = w.wave;
								w.divideBy( -1 );
								w.subtract( w.getValueAt( w.getDataLength() - 1 ) );
								w.divideBy( w.getMax() );
								nplc = nplcFromWave( w, 0.1 );
								
								resolver( w );
							} );
						}

						yield;

						i++;
					}
				}

				var pert = perturbator();
				pert.next();
			});
		}



		var method = tpc();
		method.next();
	});

};