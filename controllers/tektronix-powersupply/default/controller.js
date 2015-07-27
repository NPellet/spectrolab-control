
"use strict";

var
  extend = require('extend'),
  events = require("events"),
  path = require("path"),
  pythonShell = require("python-shell"),
  promise = require("bluebird");

var InstrumentController = require("../../instrumentcontroller");
var Waveform = require("../../../server/waveform");

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

      module.log( "Trying to connect to Tektronix PWS on host " + module.params.host + " via VISA" );

      // Checking if the PWS is reachable
      module.shellInstance = new pythonShell( 'io.py', {

        scriptPath: path.resolve( 'server/util/visa/' ),
        args: [ module.params.host ], // Pass the VISA address
        mode: "text" // Text mode

      } );


      module.shellInstance.once( "message", function( message ) {

        if( message == "ok" ) {
          module.connected = true;
          module.logOk( "Successfully found Tektronix PWS on host " + module.params.host + " via VISA" );
        } else {
          module.logError( "Cannot find Tektronix PWS on host " + module.params.host + " via VISA" );
        }

      } );
  }

  TektronixPWS.prototype.command = function( command ) {

      this.shellInstance.once( "message", function( message ) {

        console.log( message );

      } );

      this.shellInstance.send( command )
  }

  TektronixPWS.prototype.setVoltage = function( voltage ) {

    this.command("SOURce:VOLTage:LEVel " + getVoltage( voltage ) );

  }

  function getVoltage( v ) {
    return parseFloat( v ) + "V";
  }
  