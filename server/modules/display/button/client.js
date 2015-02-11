
define( [ 'client/js/module'], function( defaultModule ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {
			
		var self = this;
		this.button = this.getDom().find('.button');
			
		this.button.on('click', function() {
			console.log('out');
			self.out('click');
		});
	
	}

	module.prototype.in = {

		"setText": function( text ) {

			var button = this.button;
			button.attr( 'value', text );
		}
	};

	module.prototype.setStatus = function( status ) {

		this.button.attr( 'value', status.text );
	}

	return module;

} );
