var color = require("color");
var Waveform = require("../../../../app/waveform");


module.exports = function( config, app ) {

	var keithley = app.getInstrument("KeithleySMU");
	var arduino = app.getInstrument("arduinoDigio");
	var afg = app.getInstrument("tektronix-functiongenerator");

	var PWSWhite = app.getInstrument("PowerSupplyWhiteLED");
	var PWSColor = app.getInstrument("PowerSupplyColoredLED");


	var nbpoints = 500; // Fixed number of point. Now the question is the delay between every point ?

	var perturbationIteration = 0.15;
	var perturbationValue = 1; // 6V initi

	var decaytime;
	var nplc = false;
	var period = config.pulsewidth * 30;
	var periodKeithley = config.pulsewidth * 20;

	function calculateNPLC( decaytime, nbpoints ) {
		// time per point
		var timeperpoint = ( decaytime ) / nbpoints;
		var nplc = timeperpoint / 16e-3;


		nplc = Math.round( nplc * 500 ) / 500;

		if( nplc < 0.001 ) {
			nplc = 0.001;
		}

		if( nplc > 0.1 ) {
			nplc = 0.1;
		}

		return nplc;
	}

	function nplcFromWave( wave, level ) {

		decaytime = wave.findLevel( level, {
			rounding: 'after',
        	direction: 'ascending',
			edge: "descending",
			rangeP: [ 0, wave.getDataLength() - 1 ]
		} );

		if( ! decaytime || decaytime > wave.getDataLength() - 1 ) {
			decaytime = wave.getXFromIndex( wave.getDataLength() - 1 );
		} else {
			decaytime = wave.getXFromIndex( decaytime );
		}
		
		decaytime *= 8; // We want to see 3 times longer than the fittable decay time

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
		afg.setPulsePeriod( config.afgChannel, period ); // Total time is 6x the pulse width
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
			var current = -1;

			return new Promise( function( resolver, rejecter ) {
				
				var perturbed = 0;

				function *perturbator() {

					var perturbed = 0,
						i = 0;

					perturbationValue --;
					var levelRatio = ( Math.exp( perturbationValue / 35 * 2  ) - 1 ) / ( Math.exp( 2 ) - 1 ); // Between 0 and 1

					var newVoltage = Math.round( ( PWSColor.getConfig().maxVoltage - PWSColor.getConfig().minVoltage ) * levelRatio * 10000 ) / 10000 + PWSColor.getConfig().minVoltage;
					PWSColor.setVoltageLimit( newVoltage );

					setTimeout( function() {
						pert.next();
					}, 2000 );
					yield;

					while( true ) {

						if( current != -1 ) {
							current = current < 2e-7 ? current * 0.5 : ( current < 2e-6 ? current / 5 : current / 10 );
							app.getLogger().info( "Perturbation :" + perturbed + "A. Required:" + current + "A" );
						}
						
						if( perturbed < current && perturbationValue < 35 || current == -1 || perturbed > 1 ) {
							var levelRatio = ( Math.exp( perturbationValue / 35 * 2  ) - 1 ) / ( Math.exp( 2 ) - 1 ); // Between 0 and 1
							var newVoltage = Math.round( ( PWSColor.getConfig().maxVoltage - PWSColor.getConfig().minVoltage ) * levelRatio * 10000 ) / 10000 + PWSColor.getConfig().minVoltage;
							PWSColor.setVoltageLimit( newVoltage );

							setTimeout( function() {
								pert.next();
							}, 1000 );
							yield;
							
							if( perturbed > 0 ) {
								app.getLogger().info( "Perturbation is not strong enough (" + perturbed + "A vs " + current + "A required). Ramping PWS voltage up to " + newVoltage + "V" );
								perturbationValue ++;

							

							}

							keithley.tpc( {

								channel: "smub",
								npoints: nbpoints,
								ncycles: config.trialaveraging,
								nplc: calculateNPLC( periodKeithley, nbpoints ), // Length is 5 times the pulse width
								delay: 0

							} ).then( function( w ) {

								current = - w.current;
								perturbed = Math.abs( w.wave.getMax() - w.wave.getMin() );

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

								dotpc( Math.round( config.averaging / 3 ), calculateNPLC( config.pulsewidth * 16, nbpoints ) ).then( function( w ) {
									pert.next();
									renderer.getModule( "tpctemp" ).newSerie( "tpc_temp", w, { lineColor: 'grey' } );
									renderer.getModule( "tpctemp" ).autoscale();
								});

								yield;
							}


							period = config.pulsewidth + Math.max( 1e-1, decaytime * 4 );
							periodKeithley = config.pulsewidth + Math.max( 1e-1, decaytime * 2 )

							afg.setPulsePeriod( config.afgChannel, period ); // Total time is 6x the pulse width

							

							dotpc( config.averaging, nplc ).then( function( w ) {
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


		function dotpc( averaging, nplcToUse ) {

			

			return new Promise( function( resolver, rejecter ) {

				function *tpcgen() {

					var nJsCycles = 1;
					var ncycles = averaging;
					if( nbpoints * ncycles > 40000 ) {

						nJsCycles = Math.ceil( ( nbpoints * averaging ) / 40000 );
						ncycles = Math.ceil( averaging / nJsCycles );
					} else {
						ncycles = Math.ceil( averaging );
					}

					var ws = [];
					for( var j = 0; j < nJsCycles; j ++ ) {

						keithley.tpc( {

							channel: "smub",
							npoints: nbpoints,
							ncycles: ncycles,
							nplc: nplcToUse,
							delay: config.pulsewidth

						} ).then( function( w ) {

							renderer.getModule( "tpctemp" ).newSerie( "tpc_temp", w.wave, { lineColor: 'grey' } );
							renderer.getModule( "tpctemp" ).autoscale();

							ws.push( w.wave );
							tpcit.next();

						} );

						yield;
					}

					var w = Waveform.average.apply( Waveform, ws );
					w.setXWave( ws[ 0 ].getXWave() );

					w.divideBy( -1 );
					w.subtract( w.getValueAt( w.getDataLength() - 1 ) );
					w.divideBy( w.getMax() );
					nplc = nplcFromWave( w, 0.1 );
					resolver( w );
				}

				var tpcit = tpcgen();
				tpcit.next();

			});
		}



		var method = tpc();
		method.next();
	});

};