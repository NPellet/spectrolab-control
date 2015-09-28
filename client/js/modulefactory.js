
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

      modules = {};
      var requiring = 0;

      var promises = [];

        console.log('look for it');
      $( global )
      .find( '.module' )
      .each( function( ) {

        var dom = $( this ),
          id = dom.attr('data-moduleid'),
          path = dom.attr( 'data-path' );


        promises.push( new Promise( function( resolver, rejecter ) {

          require( [ 'getmodule-' + path ], function( ModuleConstructor ) {

              var module = new ModuleConstructor();
              module.init();
              module.setId( id );
              module.setDom( dom );
              modules[ id ] = module;

              resolver();
          } );

      } ) );

      });

      return Promise.all( promises ).then( function() {

        exports.allModules( function( module ) {
        
          module.onDomReady();

        } );

      } );
    },

    allModules: function( callback ) {

      for( var i in modules ) {
        callback( modules[ i ] );
      }

    }
  };

  return exports;

} );
