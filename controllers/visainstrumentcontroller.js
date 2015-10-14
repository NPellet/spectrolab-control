
"use strict";

var pythonShell = require("python-shell");
var path = require("path");
var instrumentcontroller = require("./instrumentcontroller");
var util = require("util");

var VISAInstrumentController = function() {};

util.inherits( VISAInstrumentController, instrumentcontroller );


VISAInstrumentController.prototype.connect = function(  ) {

    var module = this;

    return new Promise( function( resolver, rejecter ) {

      if( module.connecting ) {
        return new Promise( function( resolver ) { 
          module.connecting.then( function() {
            resolver();
          });
        });
      }

      // Avoid multiple connection
      if( module.connected ) {

        resolver();
        return;
      }

      module.connecting = this;
      module.emit("connecting");

      module.log( "Trying to connect to VISA resource (" + module.getName() + ") on host " + module.config.host + " via VISA" );

      /* Handles connection timeout */
      var timeout = setTimeout( function() {

        module.connected = false;
        module.connecting = false;

        module.emit("connectionerror");
        
        rejecter();

        module.logError( "Timeout while reaching VISA resource (" + module.getName() + ") on host " + module.config.host + " via VISA" );

        if( module.shellInstance ) {
          module.shellInstance.end();
        }

      }, 10000 );

      // Checking if the PWS is reachable
      module.shellInstance = new pythonShell( 'iovisa.py', {

        scriptPath: path.resolve( 'app/util/visa/' ),
        args: [ module.config.host ], // Pass the VISA address
        mode: "text" // Text mode

      } );

     module.shellInstance.once( "error", function( error ) {

    //    rejecter( module );
        module.connected = false;
        module.connecting = false;
        module.emit("connectionerror");

        rejecter();

        module.logError("Error while connecting to " + module.getName() + ". Check connection and cables. You may have to reboot the instrument. Error was: " + error );
      });

      module.shellInstance.once( "message", function( data ) {
          clearTimeout( timeout );
          module.connected = true;
          module.connecting = false;
          module.logOk( "Successfully found VISA resource (" + module.getName() + ") on host " + module.config.host + " via VISA. Resource name: " + data );
          
          module.emit("connected");

          resolver();

      } );


      module.shellInstance.send("connect");

  } );
}

VISAInstrumentController.prototype.query = function( command ) {
    
    var self = this;
    return new Promise( function( resolver, rejecter ) {

      self.connect().then( function() {
        
        setTimeout( function() {
          
          self.shellInstance.once( "message", function( message ) {

            resolver( message );
          } );

          self.shellInstance.send( command );  

        }, 100 );
        

      } );

    } );
}


module.exports = VISAInstrumentController;
