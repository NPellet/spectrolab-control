
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

    'connectionerror': function() {
      this.error();
    }
  };

  module.prototype.connected = function() {
    var connect = this.connect;
    connect.html("Disconnect");
    this.getDom().addClass('panel-success').removeClass("panel-warning panel-error panel-primary");
    connect.removeClass('btn-primary btn-warning btn-danger').addClass('btn-success');
  }

  module.prototype.disconnected = function() {
    var connect = this.connect;
    connect.html("Connect");
    this.getDom().removeClass('panel-success panel-warning panel-error').addClass("panel-primary");
    connect.removeClass('btn-success btn-warning btn-danger').addClass('btn-primary');
  }

  module.prototype.error = function() {
    var connect = this.connect;
    connect.html("Reconnect");
    this.getDom().removeClass('panel-success panel-primary panel-error').addClass("panel-danger");
    connect.removeClass('btn-success btn-warning btn-danger').addClass('btn-danger');
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
