
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
					this.status.text = text;
					this.button.attr( 'value', this.status.text );
				},

				"setStatus": function( color ) {

					this.status.color = color;
					this.button.attr( 'data-color', this.status.color );
				}
	};

	module.prototype.setStatus = function( status ) {

		this.button.attr( 'value', status.text );
		this.button.attr( 'data-color', status.color );
	}

	return module;

} );
