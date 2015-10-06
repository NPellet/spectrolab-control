
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

      module.log( "Trying to connect to VISA resource (" + module.getName() + ") on host " + module.params.host + " via VISA" );

      /* Handles connection timeout */
      var timeout = setTimeout( function() {

        module.connected = false;
        module.connecting = false;

        module.emit("connectionerror");
        
        rejecter();

        module.logError( "Timeout while reaching VISA resource (" + module.getName() + ") on host " + module.params.host + " via VISA" );

        if( module.shellInstance ) {
          module.shellInstance.end();
        }

      }, 10000 );

      // Checking if the PWS is reachable
      module.shellInstance = new pythonShell( 'iovisa.py', {

        scriptPath: path.resolve( 'app/util/visa/' ),
        args: [ module.params.host ], // Pass the VISA address
        mode: "text" // Text mode

      } );

     module.shellInstance.once( "error", function( error ) {
console.log( error );
        clearTimeout( timeout );
    //    rejecter( module );
        module.connected = false;
        module.connecting = false;
        module.emit("connectionerror");

        rejecter();

        module.logError("Error while connecting to " + module.getName() + " . Check connection and cables. You may have to reboot it. Error was: " + error );
      });

      module.shellInstance.once( "message", function( message ) {
console.log( message );
        clearTimeout( timeout );
        if( message == "ok" ) {

          module.connected = true;
          module.connecting = false;
          module.logOk( "Successfully found VISA resource (" + module.getName() + ") on host " + module.params.host + " via VISA" );
          
          module.emit("connected");

          resolver();


        } else {
          module.logError( "Cannot find VISA resource (" + module.getName() + ") on host " + module.params.host + " via VISA" );

          module.emit("connectionerror");
        }

      } );


      module.shellInstance.send("connect\n");

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
