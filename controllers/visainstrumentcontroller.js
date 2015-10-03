
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

      }, function( err ) {
        if( err ) {

           module.logError( "Cannot connect to VISA resource (" + module.getName() + "). IO error: " + err );

        }
      } );


      module.shellInstance.once( "message", function( message ) {

        clearTimeout( timeout );
        if( message == "ok" ) {

          module.connected = true;
          module.connecting = false;
          module.logOk( "Successfully found VISA resource (" + module.getName() + ") on host " + module.params.host + " via VISA" );

          module.turnOff();

          module.emit("connected");

          console.log('RESOLVE');
          resolver();


        } else {
          module.logError( "Cannot find VISA resource (" + module.getName() + ") on host " + module.params.host + " via VISA" );

          module.emit("connectionerror");
        }

      } );
  } );
}

VISAInstrumentController.prototype.query = function( command ) {
    
    var self = this;
    return new Promise( function( resolver, rejecter ) {
console.log( command );
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
