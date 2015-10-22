var color = require("color");
var Waveform = require("../../../../app/waveform");

module.exports = function( config, app ) {

	var keithley = app.getInstrument("KeithleySMU");
	var arduino = app.getInstrument("arduinoDigio");
	var afg = app.getInstrument("tektronix-functiongenerator");

	var PWSWhite = app.getInstrument("PowerSupplyWhiteLED");
	var PWSColor = app.getInstrument("PowerSupplyColoredLED");


	var nbpoints = 500; // Fixed number of point. Now the question is the delay between every point ?

	var perturbationIteration = 0.1;
	var perturbationValue = 0; // 6V initi
	
	var period, periodKeithley;
	var decaytime;
	var nplc;

	period = config.pulsewidth * 30;
	periodKeithley = config.pulsewidth * 20;

	function calculateNPLC( decaytime, nbpoints ) {
		// time per point
		var timeperpoint = ( decaytime ) / nbpoints;
		var nplc = timeperpoint / 20e-3;


		nplc = Math.round( nplc * 500 ) / 500;

		if( nplc < 0.001 ) {
			nplc = 0.001;
		}

		if( nplc > 1 ) {
			nplc = 1;
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

		return calculateNPLC( Math.min( config.pulsewidth * 20, decaytime ), nbpoints );
	}

	function maxNPLC() {

		periodKeithley = 1 * 20e-3 * nbpoints;
		period = config.pulsewidth + periodKeithley * 2;

		afg.setPulsePeriod( config.afgChannel, period ); // Total time is 6x the pulse width
		return 1;
	}

	

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

			config.pulseColor = 'red';
			arduino.routeLEDToAFG( config.pulseColor, config.afgChannel );
			
			while( true ) {

				
				Promise.all( [ PWSWhite.setVoltageLimit( levels[ i ].voltage ), PWSWhite.turnOn(), PWSColor.turnOn(), afg.enableChannel( 1 ) ] ).then( function() {
					
					app.getLogger().info("Setting current to white LED. Voltage: " + levels[ i ].voltage + "V. Sun intensity: " + levels[ i ].text );

					perturbation( i == 0 ).then( function( d ) {
						TPV = d;
						method.next();
					} );

				} );

				yield;

				
				progress( TPV, levels[ i ] );

				i++;

				if( i >= levels.length - 1 ) {
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
			var level = 5e-3;
			var i = 0;
			return new Promise( function( resolver, rejecter ) {
				
				var perturbed = 0;

				function *perturbator() {

					var perturbed = 0;

					perturbationValue --;
					var levelRatio = ( Math.exp( perturbationValue / 35 * 2  ) - 1 ) / ( Math.exp( 2 ) - 1 ); // Between 0 and 1
					var newVoltage = Math.round( ( PWSColor.getConfig().maxVoltage - PWSColor.getConfig().minVoltage ) * levelRatio * 10000 ) / 10000 + PWSColor.getConfig().minVoltage;
					PWSColor.setVoltageLimit( newVoltage );


					setTimeout( function() {
						pert.next();
					}, 5000 );
					yield;

					while( true ) {

						if( perturbed < level && perturbationValue < 35 ) {

					
							var levelRatio = ( Math.exp( perturbationValue / 35 * 2  ) - 1 ) / ( Math.exp( 2 ) - 1 ); // Between 0 and 1
							var newVoltage = Math.round( ( PWSColor.getConfig().maxVoltage - PWSColor.getConfig().minVoltage ) * levelRatio * 10000 ) / 10000 + PWSColor.getConfig().minVoltage;
							PWSColor.setVoltageLimit( newVoltage );


							setTimeout( function() {
								pert.next();
							}, 1000 );
							yield;
							

							if( perturbed > 0 ) {

								app.getLogger().info( "Perturbation is not strong enough (" + perturbed + "V vs " + level + "V required). Ramping PWS voltage up to " + ( newVoltage ) + "V"  );
								perturbationValue += 1;
							}

							//timeperpoint = Math.max( 50e-6, timeperpoint );
							keithley.tpv( {

								channel: "smub",
								npoints: nbpoints,
								ncycles: config.trialaveraging,
								nplc: nplc ? calculateNPLC( Math.min( 10, Math.max( 1e-1, periodKeithley ) ) + config.pulsewidth, nbpoints ) : maxNPLC( ), // Length is 5 times the pulse width
								delay: 0

							} ).then( function( w ) {


								perturbed = Math.abs( w.getMax() - w.getMin() );
								console.log("PERTURBED: " + perturbed );

								renderer.getModule( "tpvtemp" ).newSerie( "tpv_temp", w, { lineColor: 'grey' } );
								renderer.getModule( "tpvtemp" ).autoscale();

								// Stabilization not ok
								if( w.getValueAt( w.getIndexFromX( config.pulsewidth ) ) < w.getValueAt( w.getDataLength() - 1 ) ) {
									perturbed = 0;
								}

								if( isNaN( perturbed ) ) {
									perturbed = 0;
								}

								if( skipFirst && i == 0 ) {
									perturbed = 0;
								}

								pert.next();	
								
							} );

							yield;
	
						} else {
							

							if( ! nplc ) {
						
								dotpv( Math.ceil( config.averaging / 3 ), maxNPLC( ) ).then( function( w ) {
									pert.next();
									renderer.getModule( "tpvtemp" ).newSerie( "tpv_temp", w, { lineColor: 'grey' } );
									renderer.getModule( "tpvtemp" ).autoscale();
								});

								yield;
							}

							dotpv( config.averaging, calculateNPLC( periodKeithley, nbpoints ) ).then( function( w ) {
								resolver( w );
							});

							yield;
						
						}



						i++;
					}
				}

				var pert = perturbator();
				pert.next();
			});
		}



		function dotpv( averaging, nplcToUse ) {

			return new Promise( function( resolver, rejecter ) {

				function *tpvgen() {

console.log( averaging, periodKeithley );

					if( averaging * period < 20 ) {
						averaging = Math.ceil( 20 / period );
					}
console.log( averaging );
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


						keithley.tpv( {

							channel: "smub",
							npoints: nbpoints,
							ncycles: ncycles,
							nplc: nplcToUse,
							delay: config.pulsewidth

						} ).then( function( w ) {

							renderer.getModule( "tpvtemp" ).newSerie( "tpv_temp", w, { lineColor: 'black' } );
							renderer.getModule( "tpvtemp" ).autoscale();

							ws.push( w );
							tpvit.next();

						} );

						yield;
					}

					var w = Waveform.average.apply( Waveform, ws );
					w.setXWave( ws[ 0 ].getXWave() );

					w.subtract( w.getValueAt( w.getDataLength() - 1 ) );
					w.divideBy( w.getMax() );

					renderer.getModule( "tpvtemp" ).newSerie( "tpv_temp", w, { lineColor: 'black' } );
					renderer.getModule( "tpvtemp" ).autoscale();
console.log( w );
					nplc = nplcFromWave( w, 0.1 );

					period = config.pulsewidth + Math.min( 12, Math.max( 1e-1, decaytime * 3 ) );
					periodKeithley = Math.min( 10, Math.max( 0.2e-1, decaytime * 1 ) );

					afg.setPulsePeriod( config.afgChannel, period ); // Total time is 6x the pulse width

					resolver( w );
				}

				var tpvit = tpvgen();
				tpvit.next();

			});
		}



		var method = tpv();
		method.next();
	});

};