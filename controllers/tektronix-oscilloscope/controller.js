


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


  HORizontal:ACQDURATION? (Query Only)
This query returns the timebase duration. Group Horizontal
Syntax HORizontal:ACQDURATION?
Returns <NR3> returns the duration of the acquisition.
Examples HORIZONTAL:ACQDURATION? might return :HORIZONTAL:ACQDURATION 5.0E-9, indicating the acquisition duration is 5.0 us.
HORizontal:ACQLENGTH? (Query Only)



  return Promise.all( [] )
}


Controller.prototype.query = function( query ) {
  return callCommand( this, query ).then( function( data ) {
    return data.replace("\n", "");
  } );
}

function callCommand( instance, cmd ) {

  var promise = new Promise();

  if( cmd.indexOf('?') > -1 && clbk ) {

    function listen( prevData ) {

      instance.once( 'data', function( data ) {

        data = prevData + data.toString('ascii');
        if( data.indexOf("\n") == -1 ) {
          listen( data );
        } else {
          promise.resolve( data );
        }
      } );
    }

    listen("");
  }

  instance.send( cmd ); 

  return promise(); 
}

module.exports = Keithley;



