
// Module Factory
define( [ 'jquery' ], function( $ ) {

  var modules = {};

  var exports = {

    getModule: function( id ) {

      if( modules[ id ] ) {
        return modules[ id ];
      }
    },

    parseDom: function( global ) {

      var requiring = 0;

      $( global )
      .find( '.module' )
      .each( function( ) {

        var dom = $( this ),
          id = dom.attr('data-moduleid'),
          path = dom.attr( 'data-path' );

        requiring++;

        require( [ 'getmodule-' + path ], function( ModuleConstructor ) {

            var module = new ModuleConstructor();
            module.init();
            module.setId( id );
            module.setDom( dom );
            modules[ id ] = module;

            requiring--;
            if( requiring == 0) {

              exports.allModules( function( module ) {
                module.onDomReady();
              } );

            }

        } );

      } );
      
    },

    allModules: function( callback ) {

      for( var i in modules ) {
        callback( modules[ i ] );
        modules[ i ].getStatus();
      }
      
    }
  };

  return exports;

} );
