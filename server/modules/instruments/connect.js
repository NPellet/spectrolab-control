
define( [ 'js/module'], function( defaultModule ) {

  var module = function() {}

  module.prototype = new defaultModule();

  module.prototype.onDomReady = function() {

    var self = this;

    var connect = $( "#connect-" + this.getId() );
    this.connect = connect;

    connect.on( 'click', function() {
      self.out( "connect" );
    } );
  }

  module.prototype.in = {

    "connected": function( text ) {
      this.connected();
    },

    "disconnected": function( text ) {
      this.disconnected();
    },

    'error': function() {
      this.error();
    }

  };

  module.prototype.connected = function() {
    var connect = this.connect;
    connect.html("Disconnect");
    this.getDom().addClass('panel-success').removeClass("panel-warning panel-error panel-primary");
    connect.removeClass('label-primary label-warning label-error').addClass('label-success');
  }

  module.prototype.disconnected = function() {
    var connect = this.connect;
    connect.html("Connect");
    this.getDom().removeClass('panel-success panel-warning panel-error').addClass("panel-primary");
    connect.removeClass('label-success label-warning label-error').addClass('label-primary');
  }

  module.prototype.error = function() {
    var connect = this.connect;
    connect.html("Reconnect");
    this.getDom().removeClass('panel-success panel-primary panel-error').addClass("panel-error");
    connect.removeClass('label-success label-warning label-error').addClass('label-error');
  }

  module.prototype.setStatus = function( status ) {

    switch( status ) {

      case 'connected':
          this.connected();
      break;

      case 'disconnected':
          this.disconnected();
      break;

      case 'error':
          this.error();
      break;
    }
  }

  return module;

} );
