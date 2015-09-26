
"use strict";

var
  extend = require('extend'),
  events = require("events"),
  path = require("path"),
  pythonShell = require("python-shell"),
  promise = require("bluebird");

var InstrumentController = require("../../instrumentcontroller");
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

            }, function( data ) {

              if( element.command != "*OPC?" ) {
                self.logError("Error on oscilloscope while running command \"" + element.command + "\". Response: " + data );
              }
              element.promiseReject( { data: data, command: element.command } );

            } ).finally( function() {

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


TektronixOscilloscope.prototype = new InstrumentController();

TektronixOscilloscope.prototype.connect = function(  ) {

    var module = this;

    return new Promise( function( resolver, rejecter ) {

      // Avoid multiple connection
      if( module.connected ) {

        resolver();
        return;
      }

      console.log( "Trying to connect to host " + module.params.host + " via VXI11" );


      var timeout = setTimeout( function() {
        module.shellInstance.end( function() {
          module.emit("connectionerror");
        });


      }, module.params.timeout || 10000 );


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

      module.connected = true;

      module.shellInstance.once( 'message', function( data ) {

          if( data == "IO:connected" ) {

            // Timeout is fine
            clearTimeout( timeout );
            timeout = null;

            module.getErrors().then( function() {

              resolver( module );
              module.stopAquisition();
              module.emit("connected");

            });

          } else if( data == "IO:unreachable") {
            rejecter( module );
            module.emit("connectionerror");
          }
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
    }).catch( function( error ) {
      // Reset queue
      throw error;
      self.queue = [];
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
            data = data.replace("\n", "");
            if( data.indexOf( "ERROR" ) > -1 ) {
              rejecter( data );
            } else {
              resolver( data );
            }

          } );
        }

        listen("");

        module.shellInstance.send( query );

      } else {

        module.shellInstance.send( query );
        resolver();
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
  } );
}

TektronixOscilloscope.prototype.enableChannel = function( channel ) {
  channel = getChannel( channel );
  return this.command("SELect:" + channel + " ON" );
}

TektronixOscilloscope.prototype.disableChannel = function( channel ) {
  channel = getChannel( channel );
  return this.command("SELect:" + channel + " OFF" );
}

TektronixOscilloscope.prototype.disableChannels = function( ) {
  var self = this;
  [ 1, 2, 3, 4 ].map( function( i ) {
      self.disableChannel( i );
  });
}

TektronixOscilloscope.prototype.enableChannels = function( ) {
  var self = this;
  [ 1, 2, 3, 4 ].map( function( i ) {
      self.enableChannel( i );
  });
}

TektronixOscilloscope.prototype.disableDelayMode = function( ) {
  return this.command("HORizontal:MAIn:DELay:MODe OFF");
}
TektronixOscilloscope.prototype.enableDelayMode = function( ) {
  return this.command("HORizontal:MAIn:DELay:MODe ON");
}

TektronixOscilloscope.prototype.setTriggerRefPoint = function( ref ) {
  ref = getInt( ref );
  this.enableDelayMode();
  return this.command("HORizontal:MAIn:DELay:POSition " + ref );
}

TektronixOscilloscope.prototype.setTriggerCoupling = function( coupling ) {
  coupling = getMnemonic( coupling, [ "AC", "DC", "HFRej", "LFRej", "NOISErej", "ATRIGger" ] );
  return this.command("TRIGger:A:EDGE:COUPling " + coupling );
}

TektronixOscilloscope.prototype.setTriggerToChannel = function( channel ) {
  channel = getChannel( channel );
  return this.command("TRIGger:A:EDGE:SOURCE " + channel );
}

TektronixOscilloscope.prototype.setTriggerLevel = function( level ) {
  level = getFloat( level );
  return this.command("TRIGger:A:LEVel " + level );
}

TektronixOscilloscope.prototype.setTriggerSlope = function( channel, slope ) {
  channel = getChannel( channel );
  slope = getMnemonic( slope, [ 'RISe', 'FALL', 'EITher' ] );
  return this.command("TRIGGER:A:EDGE:SLOPE:" + channel + " " + slope );
}

TektronixOscilloscope.prototype.setTriggerMode = function( mode ) {
  mode = getMnemonic( mode, [ "NORMal", "AUTo" ] );
  return this.command("TRIGGER:A:MODe " + mode );
}

TektronixOscilloscope.prototype.disableAveraging = function() {
  return this.setAcquisitionMode( "SAMPLE" );
}

TektronixOscilloscope.prototype.enableAveraging = function() {
  return this.setAcquisitionMode( "AVERAGE" );
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


TektronixOscilloscope.prototype.setRecordLength = function( l ) { // time
  var l = getInt( l );
  return this.command("HORizontal:MODE:RECOrdlength " + l );
}

TektronixOscilloscope.prototype.getRecordLength = function() {
  return this.command("HORizontal:MODE:RECOrdlength?" );
}


TektronixOscilloscope.prototype.setHorizontalScale = function( scale ) {

  var self = this;

  this.getHorizontalMode().then( function( mode ) {


    switch( mode ) {
      case 'MANUAL':

          self.getRecordLength().then( function( rlength ) {
            self.setSampleRate( rlength / ( scale * 10 ) );
          } );

      break;
      default:
        scale = getFloat( scale );
        return self.command("HORizontal:MODE:SCAle " + scale );
      break;
    }

  });
}
TektronixOscilloscope.prototype.getHorizontalScale = function() {
  return this.command("HORizontal:MODE:SCAle?");
}

TektronixOscilloscope.prototype.setHorizontalMode = function() {
  mode = getMnemonic( mode, [ 'AUTO', 'CONStant', 'MANual' ] );
  return this.command("HORizontal:MODE " + mode );
}

TektronixOscilloscope.prototype.getHorizontalMode = function() {
  return this.command("HORizontal:MODE?");
}

TektronixOscilloscope.prototype.setSampleRate = function( rate ) {
  rate = getInt( rate );
  return this.command("HORizontal:MODE:SAMPLERate " + rate );
}

TektronixOscilloscope.prototype.getSampleRate = function( ) {
  return this.command("HORizontal:MODE:SAMPLERate?");
}

TektronixOscilloscope.prototype.getVerticalScale = function( channel ) {
  channel = getChannel( channel );
  return this.command( channel + ":SCALE?");
}

TektronixOscilloscope.prototype.setVerticalScale = function( channel, vscale ) {
  channel = getChannel( channel );
  vscale = getFloat( vscale );
  return this.command( channel + ":SCALE " + vscale );
}

TektronixOscilloscope.prototype.getPosition = function( channel ) {
  channel = getChannel( channel );
  return this.command( channel + ":POSition?");
}

TektronixOscilloscope.prototype.setPosition = function( channel, position ) {
  channel = getChannel( channel );
  position = getInt( position );
  return this.command( channel + ":POSition " + position );
}

TektronixOscilloscope.prototype.getOffset = function( channel ) {
  channel = getChannel( channel );
  return this.command( channel + ":OFFSet?");
}

TektronixOscilloscope.prototype.setOffset = function( channel, offset ) {
  channel = getChannel( channel );
  offset = getInt( offset );
  return this.command( channel + ":OFFSet " + offset );
}


TektronixOscilloscope.prototype.enable50Ohms = function( channel ) {
  channel = getChannel( channel );
  return this.command( channel + ":TERMINATION 50" );
}

TektronixOscilloscope.prototype.disable50Ohms = function( channel ) {
  channel = getChannel( channel );
  return this.command( channel + ":TERMINATION 1000000" );
}


TektronixOscilloscope.prototype.get50Ohms = function( channel ) {

  channel = getChannel( channel );

  return this.query( channel + ":TERMINATION?" ).then( function( val ) {


  });
}


TektronixOscilloscope.prototype.setCoupling = function( channel, coupling ) {
  channel = getChannel( channel );
  coupling = checkCoupling( coupling );
  return this.command( channel + ":COUPLING " + coupling );
}

TektronixOscilloscope.prototype.getCoupling = function( channel ) {
  channel = getChannel( channel );
  return this.command( channel + ":COUPLING", true ).then( function( value ) {
  });
}


TektronixOscilloscope.prototype.setOffset = function( channel, offset ) {
  offset = getExpValue( offset );
  channel = getChannel( channel );
  return this.command( channel + ":OFFSET " + offset );
}


TektronixOscilloscope.prototype.getOffset = function( channel ) {
  channel = getChannel( channel );
  return this.command( channel + ":OFFSET?").then( function( v ) {
    return parseFloat( v );
  });
}

TektronixOscilloscope.prototype.setPosition = function( channel, position ) {
  position = getExpValue( position );
  channel = getChannel( channel );
  return this.command( channel + ":POSITION " + position );
}

TektronixOscilloscope.prototype.getPosition = function( channel ) {
  channel = getChannel( channel );
  return this.command( channel + ":POSITION?" );
}


TektronixOscilloscope.prototype.getChannel = function( channel ) {

  var self = this;
  var t = Date.now();
  channel = getChannel( channel );



  var waveform = new Waveform();

  var promises = [];

  var length;
  promises.push( self.getAcquisitionLength().then( function( aqLength ) {
    length = aqLength;
  } ) );

  var duration;
  promises.push( self.getAcquisitionDuration().then( function( aqDuration ) {
    duration = aqDuration;
  } ) );


  var position;
  promises.push( self.getPosition( channel ).then( function( pos ) {
    position = pos;
  } ) );

  var offset;
  promises.push( self.getOffset( channel ).then( function( off ) {
    offset = off;
  } ) );


  var vscale;
  promises.push( self.getVerticalScale( channel ).then( function( v ) {
    vscale = v;
  } ) );


  return Promise.all( promises ).then( function( ) {

    self.command( "DATa:SOUrce " + channel );
    self.command( "DATa:ENCdg ASCii" );
    self.command( "WFMOutpre:BYT_Nr 8" );

    self.command( "DATa:START 1" );
    self.command( "DATa:STOP " + length );

    waveform.setXScaling( 0, duration / length );

    return self.command('CURVE?').then( function( data ) {

      var d = processData( data );
      waveform.setData( d ); // Data is comma separated. We put it in the wave
      waveform.divideBy( 256 );
      waveform.multiplyBy( vscale * 10 );
      waveform.subtract( position * vscale );
      waveform.add( offset );

      return waveform;

    } );

  } );
}

TektronixOscilloscope.prototype.getWaves = function() {
  var promises = [];
  for( var i = 1; i <= 4 ; i ++ ) {
    promises.push( this.getChannel( i ) );
  }

  return Promise.all( promises ).then( function( waves ) {
    var w = {};
    for( var i = 0; i < waves.length; i ++ ) {
      w[ i + 1 ] = waves[ i ];
    }
    return w;
  } );
}




/* MEASUREMENT GROUP */

TektronixOscilloscope.prototype.enableMeasurement = function( measNum ) {
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":STATE ON" );
}

TektronixOscilloscope.prototype.disableMeasurement = function( measNum ) {
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":STATE OFF" );
}


TektronixOscilloscope.prototype.disableMeasurements = function(  ) {
  var self = this;
  [ 1, 2, 3, 4, 5, 6, 7, 8 ].map( function( i ) {
    self.disableMeasurement( i );
  });
}


TektronixOscilloscope.prototype.setMeasurementType = function( measNum, type ) {
  type = getMnemonic( type, "AMPlitude|AREa|BURst|CARea|CMEan|CRMs|DELay|DISTDUty|EXTINCTDB|EXTINCTPCT|EXTINCTRATIO|EYEHeight|EYEWIdth|FALL|FREQuency|HIGH|HITs|LOW|MAXimum|MEAN|MEDian|MINImum|NCROss|NDUty| NOVershoot|NWIdth|PBASe|PCROss|PCTCROss|PDUty|PEAKHits|PERIod|PHAse|PK2Pk|PKPKJitter|PKPKNoise|POVershoot|PTOP|PWIdth|QFACtor|RISe|RMS|RMSJitter|RMSNoise|SIGMA1|SIGMA2|SIGMA3|SIXSigmajit|SNRatio|STDdev|UNDEFINED|WAVEFORMS")
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":TYPE " + type );
}

TektronixOscilloscope.prototype.setMeasurementSource = function( measNum, channel ) {
  channel = getChannel( channel );
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":SOURCE1 " + channel );
}

TektronixOscilloscope.prototype.setMeasurementReference = function( measNum, channel ) {
  channel = getChannel( channel );
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":SOURCE2 " + channel );
}

TektronixOscilloscope.prototype.setMeasurementMethod = function( measNum, method ) {
  method = getMnemonic( method, ["HIStogram", "MINMax", "MEAN"] );
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":METHod " + method );
}

TektronixOscilloscope.prototype.getMeasurementMethod = function( measNum, method ) {
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":METHod?");
}

TektronixOscilloscope.prototype.getMeasurementMean = function( ) {

  if( arguments.length == 1 ) {
    return this.command("MEASUrement:" + getMeasurementNumber( arguments[ 0 ] ) + ":MEAN?");
  }

  return this.all( "MEASUrement:%s:MEAN?", Array.prototype.map.call( arguments, getMeasurementNumber ), function( val ) { return parseFloat( val ); } );
}

TektronixOscilloscope.prototype.all = function( method, args, processing ) {
  var self = this;
  processing = processing || function( val ) { return val; };
  return Promise.all( args.map( function( a ) {
    return self.command( method.replace( "%s", a ) ).then( processing );
  }));
}

TektronixOscilloscope.prototype.getMeasurementMin = function( measNum ) {
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":MIN?").then( function( val ) { return parseFloat( val ); });
}

TektronixOscilloscope.prototype.getMeasurementMax = function( measNum ) {
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":MAX?").then( function( val ) { return parseFloat( val ); });
}


TektronixOscilloscope.prototype.getMeasurementCount = function( measNum ) {
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":COUNT?").then( function( val ) { return parseFloat( val ); });
}


TektronixOscilloscope.prototype.getMeasurementStdDev = function( measNum ) {
  measNum = getMeasurementNumber( measNum );
  return this.command("MEASUrement:" + measNum + ":STDdev?").then( function( val ) { return parseFloat( val ); });
}

TektronixOscilloscope.prototype.setMeasurementGating = function( gating ) {
  gating = getMnemonic( gating, [ "ON", "OFF", "ZOOM1", "ZOOM2", "ZOOM3", "ZOOM4", "CURSor" ] );
  return this.command("MEASUrement:GATing " + gating );
}

TektronixOscilloscope.prototype.getMeasurementUntilStdDev = function( measNum, stdDevLimit, maxTime, minTime, settlingTime ) {

  var scope = this,
    n = 0;

  minTime = minTime || 0;
  settlingTime = settlingTime || 0.1;

  return new Promise( function( resolver, rejecter ) {

    function *stdDevGen() {

      var t = Date.now(),
        stdDev;
      setTimeout( function() { iterator.next(); }, minTime * 1000 );
      yield;

      while( true ) {

        scope.getMeasurementStdDev( measNum ).then( function( stdDevVal ) {
          stdDev = stdDevVal;
          n++;
          iterator.next();
        });
        yield;

        if( ( ( Date.now() - t > maxTime * 1000 && maxTime ) || stdDev < stdDevLimit ) ) {
          scope.getMeasurementMean( measNum ).then( function( mean ) {
            resolver( { mean: mean, stdDev: stdDev, time: Date.now() - t, nbIterations: n } );
          });
        //  iterator.close();
        // nodejs 0.12 ?
          yield; // Generator closing ?
        }

        setTimeout( function( ) { iterator.next(); }, settlingTime * 1000 ); // Settling time in between two measurements
        yield;
      }

      }

      var iterator = stdDevGen();
      iterator.next();
    });

}

TektronixOscilloscope.prototype.optimizeMeasurement = function( measurementNumber, idealValue, tolerance, triggerFrequency, changeUp, changeDown ) {

  var self = this;
  this.setNbAverage( 16 );

  return new Promise( function( resolver, rejecter ) {

    function *runner() {

      var pass = -1;
      var direction = null;
      var currentDirection = null;

      while( true ) {

        setTimeout( function() {

          self.getMeasurementMean( measurementNumber ).then( function( mean ) {

            if( mean > idealValue + tolerance * idealValue ) { // Too high

              if( pass == -1 ) {
                direction = "down";
                pass = 0;
              }

              if( currentDirection == "up" ) {
                currentDirection = "down";

                if( direction == "down" ) {
                  pass++;
                }
              }

              if( pass > 2 ) {
                resolver();
              }

            } else if( mean < idealValue - tolerance * idealValue ) { // Too low

              if( pass == -1 ) {
                direction = "up";
                pass = 0;
              }

              if( currentDirection == "down" ) {
                currentDirection = "up";

                if( direction == "up" ) {
                  pass++;
                }
              }

              if( pass > 2 ) {
                resolver();
              }

              changeUp( pass ).then( function() {
               run.next();
              } );

            } else {

              resolver();
            }

          } );


        }, Math.min( 1 / triggerFrequency, 0.1 ) * 1000 ); // min 0.1s

        yield;
      }
    }

    var run = runner();
    run.next();

  });

}


/* CURSOR GROUP */

TektronixOscilloscope.prototype.setCursors = function( type ) {
  type = getMnemonic( type, [ "OFF", "HBArs", "VBArs", "SCREEN", "WAVEform" ] );
  return this.command("CURSor:FUNCtion " + type );
}

TektronixOscilloscope.prototype.setCursorsMode = function( mode ) {
  mode = getMnemonic( mode, [ "TRACk", "INDependent" ] );
  return this.command("CURSor:FUNCtion " + mode );
}

TektronixOscilloscope.prototype.setCursorsSource = function( channel ) {
  channel = getChannel( channel );
  return this.command("CURSor:SOUrce " + channel );
}

TektronixOscilloscope.prototype.enableCursors = function() {
  return this.command("CURSor:STATE ON");
}

TektronixOscilloscope.prototype.disableCursors = function() {
  return this.command("CURSor:STATE OFF");
}

TektronixOscilloscope.prototype.setVCursorsPosition = function( cursorNumber, pos ) {
  cursorNumber = getInt( cursorNumber );
  pos = getFloat( pos );
  return this.command("CURSor:VBArs:POSITION" + cursorNumber + " " + pos );
}



TektronixOscilloscope.prototype.ready = function( delay ) {
  //this.command( "*OPC" );
  var self = this;

  return this.command("BUSY?").then( function( data ) {

    if( data == 0 ) {
      return true;
    }
    return self.command( "*OPC?" ).then( function( data ) {
      if( delay ) {
        return new Promise( function( resolver, rejecter ) {
          setTimeout( resolver, delay * 1000 );
        })
      } else {
        return 1;
      }

    }, function( data ) {
      return self.ready();
    });

  })

}

TektronixOscilloscope.prototype.clear = function(  ) {

  return this.command("CLEAR ALL");
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
      instance.send( cmd + "?" );

    } else {

      instance.send( cmd );
    }

  } );



  return promise;
}

module.exports = TektronixOscilloscope;



function getChannel( channel, number ) {

  var v;
  if( typeof channel == "number" ) {
    channel = Math.round( channel );
    if( channel > 4 || channel < 1 ) {
      console.trace();
      throw "Channel must be between 1 and 4";
    }

    //return "CHAN" + channel;
  } else if( channel.length == 1) {
    channel = parseInt( channel );
  } else if( ( v = ( /^CH([0-4])$/.exec( channel ) ) ) ) {
    channel = parseInt( v[ 1 ] );
  }

  if( number ) {
    return channel;
  }

  return "CH" + channel;
}


function getMeasurementNumber( measurementNumber ) {

  if( typeof measurementNumber == "number" ) {
    measurementNumber = Math.round( measurementNumber );
    if( measurementNumber > 8 || measurementNumber < 1 ) {
      console.trace();
      throw "Measurement must be between 1 and 8";
    }

    //return "CHAN" + channel;
  } else if( measurementNumber.length == 1) {
    measurementNumber = parseInt( measurementNumber );
  } else if( ( v = ( /^MEAS([0-8])$/.exec( measurementNumber ) ) ) ) {
    measurementNumber = parseInt( v[ 1 ] );
  }

  return "MEAS" + measurementNumber;
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

  if( typeof haystack == "string" ) {
    haystack = haystack.split("|").map( function( a ) { return a.trim(); } );
  }

  for( var i = 0, l = haystack.length; i < l ; i ++ ) {

    if( needle == haystack[ i ].toLowerCase() ) {
      return haystack[ i ];
    }

    var el = /[A-Z]*/.exec( haystack[ i ]);

    el = el[ 0 ];
    if( el.toLowerCase() == needle ) {
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




function getFloat( i ) {
  if( typeof i == "number" ) {
    return i;
  }

  i = parseFloat( i );

  if( isNaN( i ) ) {
    return false;
  }

  return i;
}
