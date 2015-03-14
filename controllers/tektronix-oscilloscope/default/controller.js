
"use strict";

var 
  extend = require('extend'),
  events = require("events"),
  path = require("path"),
  pythonShell = require("python-shell"),
  promise = require("bluebird");

var Waveform = require("../../../server/waveform");

var TektronixOscilloscope = function( params ) {
  this.params = params;
  this.connected = false;
  this.queue = [];


  var self = this;
  function *runCommands( queue ) {

    while( true ) {

        while( queue.length == 0 ) {

          self.emit("queueEmpty");
          yield;
        }

        var running = true;

        var element = queue.shift();

        self.connect().then( function() {

            query( self, element.command ).then( function( data ) {

            element.promiseResolve( data );

          }/*, function( error ) {
            console.log('sdf');
            element.promiseReject();

          } */).finally( function() {

            running = false;
            self.commandRunner.next();

          });
        });

        yield;

        // Does nothing if next is called and the process is running already
        while( running ) {
          yield;
        }
    }
  }

  this.commandRunner = runCommands( this.queue );
  this.runCommands();
};


TektronixOscilloscope.prototype = new events.EventEmitter;

TektronixOscilloscope.prototype.connect = function(  ) {

    var module = this;

    return new Promise( function( resolver, rejecter ) {

      // Avoid multiple connection
      if( module.connected ) {

        resolver();
        return;
      }

      console.log( "Trying to connect to host " + module.params.host + " via VXI11" );

      // Launches a python instance which will communicate in VXI11 with the scope
      module.shellInstance = new pythonShell( 'io.py', {
        scriptPath: path.resolve( 'server/util/vxi11/' ),
        args: [ module.params.host ], // Pass the IP address
        mode: "text" // Text mode
      } );

    /*	module.shellInstance.on("message", function( data ) {
        console.log( data );
      })
*/

      // At this point we are already connected. No asynchronous behaviour with python
      module.connected = true;

      module.shellInstance.once( 'message', function( data ) {

          if( data == "IO:connected" ) {

            module.getErrors().then( function() {

              resolver( module );
              module.emit("connected");

            });

          } else if( data == "IO:unreachable") {
            rejecter( module );
            module.emit("connectionerror");
          }


      });



      module.shellInstance.on( 'message', function( data ) {
        console.log("Receiving from AFG: " + data );

      });



    } );

  }

  TektronixOscilloscope.prototype.runCommands = function() {

    this.commandRunner.next();
  }

  TektronixOscilloscope.prototype.command = function( command ) {

    var self = this;

    return new Promise( function( resolver, rejecter ) {

      self.queue.push( {

        command: command,
        promiseResolve: resolver,
        promiseReject: rejecter
      } );

      self.runCommands();
    });
  }





  TektronixOscilloscope.prototype.commands = function( commands ) {
    var self = this;
    commands.map( function( cmd ) {
      self.command(cmd);
    } );
  }


function query( module, query ) {

    var ask = query.indexOf('?') > -1;

    return new Promise( function( resolver, rejecter ) {

      if( ask ) {

        function listen( prevData ) {

          module.shellInstance.once( 'message', function( data ) {

            data = prevData + data.toString('ascii');

          /*	if( data.indexOf("\n") == -1 ) {
              console.log('NThr');
              listen( data );
            } else {*/

              //if( data.indexOf( query	 ) == 0 ) { // The response is exactly what has been requested
                resolver( data );
              //} else {
              //	console.log( 'Rejection');
              //	rejecter("The oscilloscope response was unexpected. Message : " + data);
              //}
            //}

          } );
        }

        listen("");

        module.shellInstance.send( query );

      } else {

        module.shellInstance.send( query );
        resolver();
      }

    } ).then( function( data ) {
      if( data ) {
        return data.replace("\n", "");
      }
    } );
}

TektronixOscilloscope.prototype.getErrors = function() {
  var self = this;
  this.command("*ESR?"); // Read errors from the Status Event Register. Put then into the queue

  return new Promise( function( resolver ) {


    var errorQueue;
  var i = 0;
    function *errors() {

      while( true ) {

        self.command("SYSTEM:ERROR:NEXT?").then( function( error ) {

            error = error.split(',');
            var errorCode = parseInt( error[ 0 ] );
            var errorMessage = error[ 1 ].replace( /"/g, '' );

            i++;
            if( i > 100 ) {
              console.log( "More than 100 errors. Infinite loop ?" );
              return; // Infinite loop. Close the iterator;
            }

            if( errorCode != 0 ) {
              console.log("Event ID: " + errorCode + "; Message: " + errorMessage );
              errorQueue.next();
            } else {

              resolver();
            }

        } );

        yield;
      }
    }

    errorQueue = errors();
    errorQueue.next();

  })

}


TektronixOscilloscope.prototype.setAcquisitionMode = function( aqMode ) {
  aqMode = getMnemonic( aqMode, ['SAMple', 'PEAKdetect', 'HIRes', 'AVErage', 'WFMDB', 'ENVelope'] );
  return this.command("ACQUIRE:MODE " + aqMode );
}

TektronixOscilloscope.prototype.getAcquisitionMode = function( ) {
  return this.command("ACQUIRE:MODE?");
}

TektronixOscilloscope.prototype.enhanceNOBAuto = function() {
  return this.command("ACQuire:ENHANCEDEnob AUTO");
}

TektronixOscilloscope.prototype.enhanceNOBOff = function() {
  return this.command("ACQuire:ENHANCEDEnob OFF");
}

TektronixOscilloscope.prototype.setNbAverage = function( value ) {
  value = getInt( value );
  return this.command("ACQuire:NUMAVg " + value );
}

TektronixOscilloscope.prototype.getNbAverage = function() {
  return this.command("ACQuire:NUMAvg?");
}

TektronixOscilloscope.prototype.getCurrentNbAcquisitions = function() { // in Sample or Avg mode
  return this.command("ACQuire:NUMACq?");
}

TektronixOscilloscope.prototype.getCurrentNbFrames = function() { // In FastFrame mode
  // TODO: Check for fast frame
  return this.command("ACQuire:NUMFRAMESACQuired?");
}

TektronixOscilloscope.prototype.setSamplingMode = function( mode ) { // Real time or equivalent time ( sampling mode ) ?
  mode = getMnemonic( mode, [ "RT", "ET", "IT" ]);
  return this.command("ACQuire:SAMPlingmode " + mode );
}

TektronixOscilloscope.prototype.getSamplingMode = function() {
  return this.command("ACQUIRE:SAMPLINGMODE?");
}

TektronixOscilloscope.prototype.startAquisition = function() {
 return this.command("ACQUIRE:STATE RUN"); // Resets current acquisitions 
}

TektronixOscilloscope.prototype.stopAquisition = function() { 
  return this.command("ACQUIRE:STATE STOP"); // Stops acquisition, even if in the middle of it
}

TektronixOscilloscope.prototype.isAquiring = function() {
  return this.command("ACQUIRE:STATE?").then( function( value ) {
    value = getInt( value );
    if( value == 0 ) {
      return false;
    }
    return true;
  }); 
}

TektronixOscilloscope.prototype.stopAfterSequence = function( bln ) {
  if( bln === undefined ) {
    bln = true;
  }
  return this.command("ACQUIRE:STOPAfter " + ( bln ? "SEQuence" : "RUNStop" ) );
}

TektronixOscilloscope.prototype.getAcquisitionDuration = function() { // time
  return this.command("HORizontal:ACQDURATION?");
}


TektronixOscilloscope.prototype.getAcquisitionLength = function() { // time
  return this.command("HORizontal:ACQLENGTH?");
}

TektronixOscilloscope.prototype.setHorizontalMode = function() {
  mode = getMnemonic( mode, [ 'AUTO', 'CONStant', 'MANual' ] );
  return this.command("HORizontal:MODE " + mode );
}

TektronixOscilloscope.prototype.setRecordLength = function( length ) {
  length = getInt( length );
  return this.command("HORizontal:MODE:RECOrdlength " + length );
}

TektronixOscilloscope.prototype.setSampleRate = function( rate ) {
  rate = getInt( rate );
  return this.command("HORizontal:MODE:SAMPLERate " + rate ); 
}


TektronixOscilloscope.prototype.getScaling = function() {

  this.query("HORIZONTAL:ACQLENGTH?").then( function( data ) {
    console.log( data );
  } );

  this.query("HORIZONTAL:ACQDURATION?").then( function( data ) {
    console.log( data );
  } );
}



TektronixOscilloscope.prototype.set50Ohms = function( channel, bln ) {

  if( bln == undefined ) {
    bln = true;
  }

  channel = checkChannel( channel );
  var terminationValue = getExpValue( bln ? 50 : 1e6 );

  return this.query("CH" + channel + ":TERMINATION " + terminationValue );
}


TektronixOscilloscope.prototype.get50Ohms = function( channel ) {

  channel = checkChannel( channel );

  return this.query("CH" + channel + ":TERMINATION?" ).then( function( val ) {


  });
}


TektronixOscilloscope.prototype.setCoupling = function( channel, coupling ) {

  if( coupling == undefined ) {
    coupling = "AC";
  }

  channel = checkChannel( channel );
  coupling = checkCoupling( coupling );
  return this.query("CH" + channel + ":COUPLING " + coupling );
}

TektronixOscilloscope.prototype.getCoupling = function( channel ) {
  channel = checkChannel( channel );
  return this.query( "CH" + channel + ":COUPLING", true ).then( function( value ) {
    val
    console.log( value );
  });
}


TektronixOscilloscope.prototype.setOffset = function( channel, offset ) {
  offset = getExpValue( offset );
  channel = checkChannel( channel );
  return this.query("CH" + channel + ":OFFSET " + offset );
}


TektronixOscilloscope.prototype.getOffset = function( channel ) {
  channel = checkChannel( channel );
  return this.query("CH" + channel + ":OFFSET?").then( function( value ) {
    console.log( value );
  });
}



TektronixOscilloscope.prototype.setPosition = function( channel, position ) {
  position = getExpValue( position );
  channel = checkChannel( channel );
  return this.query("CH" + channel + ":POSITION " + position );
}


TektronixOscilloscope.prototype.getPosition = function( channel ) {
  channel = checkChannel( channel );
  return this.query("CH" + channel + ":POSITION?").then( function( value ) {
    console.log( value );
  });
}


TektronixOscilloscope.prototype.getScaling = function() {

  this.query("HORIZONTAL:ACQLENGTH?").then( function( data ) {
    console.log( data );
  } );

  this.query("HORIZONTAL:ACQDURATION?").then( function( data ) {
    console.log( data );
  } );
}



TektronixOscilloscope.prototype.getChannel = function( channel ) {

  var self = this;

  self.command( "DATa:SOUrce CH1" );
  self.command( "DATa:SOUrce?" );
  self.command( "DATa:ENCdg ASCii" );
  self.command( "WFMOutpre:BYT_Nr 8" );


  var waveform = new Waveform();

  var promises = [];
  promises.push( self.command('CURVE?').then( function( data ) {

    waveform.setData( processData( data ) ); // Data is comma separated. We put it in the wave
    
  } ) );

  promises.push( self.getAcquisitionLength().then( function( aqLength ) {
    console.log( aqLength );
  } ) );

  return Promise.all( promises ).then( function( ) {
    return waveform;
  });
}

function processData( data ) {
  return data.split(",").map( parseFloat );
}


function callCommand( instance, cmd, ask ) {

  var queries = instance.queries;


  var promise = new Promise( function( resolver, rejecter ) {

    if( ask ) {

      function listen( prevData ) {

        instance.once( 'data', function( data ) {

          data = prevData + data.toString('ascii');
          if( data.indexOf("\n") == -1 ) {
            listen( data );
          } else {

            if( data.indexOf( cmd ) == 0 ) { // The response is exactly what has been requested
              resolver( data );
            } else {
              throw "The oscilloscope response was unexpected. Message : " + data;
            }
          }

        } );
      }

      listen("");
      instance.send( cmd + "?;*WAI" );

    } else {

      instance.send( cmd );
    }

  } );



  return promise;
}

module.exports = TektronixOscilloscope;


function checkChannel( ch ) {
  if( typeof ch == "string" ) {
    ch = parseInt( ch );
  }

  if( ch > 0 && ch < 5 ) {
    return ch;
  }

  throw "Channel is out of range";
}



function checkCoupling( coupling ) {

  switch ( coupling ) {

    case 'AC':
    case 'ac':
    case 'alternative':
      return 'AC';
    break;

    case 'DC':
    case 'dc':
    case 'direct':
      return 'DC';
    break;

    case 'gnd':
    case 'GND':
    case 'ground':
      return 'GND';
    break;
  }

  throw "Coupling not recognized";
}


function getExpValue( val ) {

  if( typeof val == "string" ) {
    val = parseFloat( val );
  }

  return val.toExponential().replace("e", "E");
}

function getFloat( val ) {
  val = parseFloat( val );

  if( isNaN( val ) ) {
    throw "Value is NaN";
    return NaN;
  }

  return val;
}


function getMnemonic( needle, haystack ) {

  needle = needle.toLowerCase();

  for( var i = 0, l = haystack.length; i < l ; i ++ ) {

    if( needle == haystack[ i ].toLowerCase() ) {
      return haystack[ i ];
    }

    if( /[A-Z]*/.exec( haystack[ i ]).toLowerCase() == needle ) {
      return haystack[ i ];
    }
  }
}

function getInt( i ) {
  if( typeof i == "number" ) {
    return Math.round( i );
  }

  i = parseInt( i );

  if( isNaN( i ) ) {
    return false;
  }

  return i;
}


