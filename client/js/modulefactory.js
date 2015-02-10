
// Module Factory
define( [ 'jQuery' ], function( $ ) {

  var modules = {};

  var exports = {

    getModule: function( id ) {

      if( modules[ id ] ) {
        return modules[ id ];
      }
    },

    parseDom: function( global ) {

      $( global )
      .find( '.module' )
      .each( function( module ) {

        var id = module.attr('data-moduleid');
        var dom = module;

        var moduleType = module.attr( 'data-address' );

        require( 'getmodule-' + moduleType, function( ModuleConstructor ) {

            var module = new ModuleConstructor();
            module.init();
            module.setId( id );
            module.setDom( dom );
            modules[ id ] = module;

        } );

      } );

    }
  };

} );
