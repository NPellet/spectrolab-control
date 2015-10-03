
var pythonShell = require("python-shell");
var path = require("path");

var instrumentcontroller = require("./instrumentcontroller");
var util = require("util");

var VXI11InstrumentController = function() {};

util.inherits( VXI11InstrumentController, instrumentcontroller );


VXI11InstrumentController.prototype.query = function( command ) {

	var instrument = this;
	return new Promise( function( resolver, rejecter ) {

		if( ! instrument.shellInstance ) {
			rejecter("Instrument has no python shell associated");
		}

		var query = command;
		var ask = query.indexOf('?') > -1;


		if( ask ) {

			function listen( prevData ) {


				instrument.shellInstance.once( 'message', function( data ) {


		            data = prevData + data.toString('ascii');
		            data = data.replace("\n", "");


		            if( data.indexOf( "ERROR" ) > -1 && command !== "*OPC?") {
		              console.log("Found error in response. Error is " + data );
		              rejecter( data );
		            } else {
		              resolver( data );
		            }



				} );
			}

			listen("");
			instrument.shellInstance.send( query );

		} else {

			instrument.shellInstance.send( query );
			resolver();
		}

	} );
}


VXI11InstrumentController.prototype.connect = function( ) {

	var instrument = this;

	if( instrument.connecting ) {
		return instrument.connecting;
	}

	var promise = new Promise( function( resolver, rejecter ) {

		// Already connected => Return ok
		if( instrument.connected ) {
			resolver();
			return;
		}

		instrument.log( "Trying to connect to " + instrument.getName() + "  on host " + instrument.params.host + " via VXI11" );

		try {

			// Launches a python instance which will communicate in VXI11 with the scope
			instrument.shellInstance = new pythonShell( 'iovxi.py', {
				scriptPath: path.resolve( 'app/util/vxi11/' ),
				args: [ instrument.params.host ], // Pass the IP address
				mode: "text" // Text mode
			} );

			// At this point we are already connected. No asynchronous behaviour with python
			instrument.shellInstance.once( 'message', function( data ) {

				if( data == "IO:connected" ) {

					instrument.connecting = false;
					instrument.connected = true;

					instrument.logOk("Connected to " + instrument.getName() + "  on host " + instrument.params.host + " via VXI11" );
					resolver( instrument );
					instrument.emit("connected");

				} else {
			//		rejecter( module );
					instrument.emit("connectionerror");
					instrument.connected = false;
					instrument.logError("Unexpected response from " + instrument.getName() + " during connection. Response was : " + data );
				}
			});

			instrument.shellInstance.on( 'error', function( error ) {

		//		rejecter( module );
				instrument.emit("connectionerror");
				instrument.connected = false;
				instrument.logError("Error while connecting to " + instrument.getName() + " . Check connection and cables. You may have to reboot it. Error was: " + error );
			});

	

		} catch( e ) {
			instrument.emit("connectionerror");
			instrument.logError("Cannot reach " + instrument.getName() + " . Check connection and cables. You may have to reboot it");
	//		rejecter();
		}
	} );

	if( ! instrument.connected ) {
		instrument.connecting = promise;
	}

	return promise;
}

module.exports = VXI11InstrumentController;
