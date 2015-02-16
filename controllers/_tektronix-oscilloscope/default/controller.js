
"use strict";

var net = require('net'),
  extend = require('extend'),
  fs = require('fs'),
  events = require("events"),
  path = require("path"),
  pythonShell = require("python-shell"),
  promise = require("bluebird");

var waveform = require("../../server/waveform");


var Controller = function( params ) {
  this.params = params;
  this.queries = [];
  this.connected = false;
};

Controller.prototype = new events.EventEmitter;

Controller.prototype.connect = function( callback ) {

  // Avoid multiple connection
  if( this.connected ) {
    callback();
    return;
  }

  // Launches a python instance which will communicate in VXI11 with the scope
  this.shellInstance = new pythonShell( 'io.py', {
    scriptPath: path.resolve( __dirname, './python-scripts/' ),
    args: [ this.params.host ], // Pass the IP address 
    mode: "text" // Text mode
  } );

  // At this point we are already connected. No asynchronous behaviour with python
  this.connected = true;

  this.setEvents(); 
};


Controller.prototype.checkConnection = function() {

  if( ! this.socket && this.connected ) {
    throw "Socket is not alive";
  }
}


Controller.prototype.setEvents = function() {
  // Unused function right now

//  this.checkConnection();

}


function processWave( val ) {
  return val.split(",");
}

Controller.prototype.set50Ohms = function( channel, bln ) {

  if( bln == undefined ) {
    bln = true;
  }

  channel = checkChannel( channel );
  var terminationValue = getExpValue( bln ? 50 : 1e6 );

  return this.query("CH" + channel + ":TERMINATION " + terminationValue );
}


Controller.prototype.get50Ohms = function( channel ) {

  channel = checkChannel( channel );

  return this.query("CH" + channel + ":TERMINATION?" ).then( function( val ) {


  });
}


Controller.prototype.setCoupling = function( channel, coupling ) {

  if( coupling == undefined ) {
    coupling = "AC";
  }

  channel = checkChannel( channel );
  coupling = checkCoupling( coupling );
  return this.query("CH" + channel + ":COUPLING " + coupling );
}

Controller.prototype.getCoupling = function( channel ) {
  channel = checkChannel( channel );
  return this.query( "CH" + channel + ":COUPLING", true ).then( function( value ) {
    val 
    console.log( value );
  });
}


Controller.prototype.setOffset = function( channel, offset ) {
  offset = getExpValue( offset );
  channel = checkChannel( channel );
  return this.query("CH" + channel + ":OFFSET " + offset );
}


Controller.prototype.getOffset = function( channel ) {
  channel = checkChannel( channel );
  return this.query("CH" + channel + ":OFFSET?").then( function( value ) {
    console.log( value );
  });
}



Controller.prototype.setPosition = function( channel, position ) {
  position = getExpValue( position );
  channel = checkChannel( channel );
  return this.query("CH" + channel + ":POSITION " + position );
}


Controller.prototype.getPosition = function( channel ) {
  channel = checkChannel( channel );
  return this.query("CH" + channel + ":POSITION?").then( function( value ) {
    console.log( value );
  });
}







Controller.prototype.getScaling = function() {

  this.query("HORIZONTAL:ACQLENGTH?").then( function( data ) {
    console.log( data );
  } );

  this.query("HORIZONTAL:ACQDURATION?").then( function( data ) {
    console.log( data );
  } );




}



Controller.prototype.getWaveform = function( channel ) {

  this.query( "DATa:SOUrce CH1" );
  this.query( "DATa:SOUrce?" );
  this.query( "DATa:ENCdg ASCii" );
  this.query( "WFMOutpre:BYT_Nr 8" );

  this.getScaling().then( function( scaling ) {


  });

  this.query("HORIZONTAL:MODE:SAMPLERRATE?").then( function( data ) {
console.log( data );
  } );


  this.query("HORIZONTAL:MODE:SCALE?").then( function( data ) {
console.log( data );
  } );

  var waveform = new Waveform();

  // Getting the curve
  promises.push(
    this.query('CURVE?').then( function( data ) {
      waveform.setData( data.split(",") ); // Data is comma separated. We put it in the wave
    } )
  );


  return Promise.all( [] )
}


Controller.prototype.query = function( query, ask ) {
  return callCommand( this, query, ask ).then( function( data ) {
    return data.replace("\n", "");
  } );
}

Controller.prototype.isBusy = function( ) {

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

module.exports = Keithley;


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
      return 'DC':
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
