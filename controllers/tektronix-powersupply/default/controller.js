
"use strict";

var
  extend = require('extend'),
  events = require("events"),
  pythonShell = require("python-shell"),
  promise = require("bluebird");

var InstrumentController = require("../../instrumentcontroller");

var TektronixPWS = function( params ) {
  this.params = params;
  this.connected = false;
  this.queue = [];

  var self = this;
};


TektronixPWS.prototype = new InstrumentController();

TektronixPWS.prototype.connect = function(  ) {

    var module = this;

    return new Promise( function( resolver, rejecter ) {

      // Avoid multiple connection
      if( module.connected ) {

        resolver();
        return;
      }

      module.emit("connecting");

      module.log( "Trying to connect to Tektronix PWS (" + module.getName() + ") on host " + module.params.host + " via VISA" );

      /* Handles connection timeout */
      var timeout = setTimeout( function() {

        module.emit("connectionerror");
        rejecter();

        module.logError( "Timeout while reaching Tektronix PWS (" + module.getName() + ") on host " + module.params.host + " via VISA" );

        if( module.shellInstance ) {
          module.shellInstance.end();
        }

      }, 5000 );


      // Checking if the PWS is reachable
      module.shellInstance = new pythonShell( 'io.py', {

        scriptPath: path.resolve( 'app/util/visa/' ),
        args: [ module.params.host ], // Pass the VISA address
        mode: "text" // Text mode

      } );


      module.shellInstance.once( "message", function( message ) {

        clearTimeout( timeout );
        if( message == "ok" ) {
          module.connected = true;
          module.logOk( "Successfully found Tektronix PWS (" + module.getName() + ") on host " + module.params.host + " via VISA" );

          module.emit("connected");

        } else {
          module.logError( "Cannot find Tektronix PWS (" + module.getName() + ") on host " + module.params.host + " via VISA" );

          module.emit("connectionerror");
        }

      } );
  } );
}

TektronixPWS.prototype.command = function( command ) {

    return new Promise( function( resolver, rejecter ) {

      this.shellInstance.on( "message", function( message ) {
        resolver( message );
      } );

      this.shellInstance.send( command )

    } );
}

TektronixPWS.prototype.setVoltageLimit = function( voltage ) {
  return this.command("SOURce:VOLTage:LEVel " + getVoltage( voltage ) );
}

TektronixPWS.prototype.setCurrentLimit = function( voltage ) {
  return this.command("SOURce:CURRent:LEVel " + getCurrent( voltage ) );
}

TektronixPWS.prototype.turnOn = function() {
  return this.command("SOURce:OUTPut:STATe ON");
}

TektronixPWS.prototype.turnOff = function() {
  return this.command("SOURce:OUTPut:STATe ON");
}

function getVoltage( v ) {
  return parseFloat( v ) + "V";
}

function getCurrent( a ) {
  return parseFloat( a ) + "A";
}

module.exports = TektronixPWS;