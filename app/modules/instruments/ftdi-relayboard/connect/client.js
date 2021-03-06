
define( [ 'js/module'], function( defaultModule ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {
			
		var self = this;
		this.button = this.getDom().find('.button');
		
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

		"connecting": function() {

			this.connecting();
		},

		"error": function() {

			this.error();
		}
	};

	module.prototype.connected = function() {

		this.connect.prop( 'value', 'Disconnect' );
		this.connect.removeClass('red').addClass('green');

		
	}



	module.prototype.disconnected = function() {

		this.connect.prop( 'value', 'Connect' );
		this.connect.removeClass('red').removeClass('green');

	
	}


	module.prototype.connecting = function() {

		this.connect.prop( 'value', 'Connecting...' );
		this.connect.removeClass('red').removeClass('green');
	}


	module.prototype.error = function() {

		this.connect.prop( 'value', 'Connection error' );
		this.connect.addClass('red').removeClass('green');
	}


	module.prototype.setStatus = function( status ) {
		
		var connect = this.connect;
		
		if( status.connected ) {
			this.connected();
		} else if( status.connecting ) {
			this.connecting();
		} else if( status.error ) {
			this.error();
		} else {
			this.disconnected();
		}
	}

	return module;

} );

