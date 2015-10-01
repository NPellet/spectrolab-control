

define(  [ 'js/module', 'bootstrap', 'lib/jquery.populate/index', 'lib/jquery-serialize-object/jquery.serialize-object'], function( defaultModule ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {
		var self = this;

		this.getForm().on("click", "input[type=button]", function( e ) {

			e.stopPropagation();

			var d = $( this ).data();
			var formData = self.getFormData();
			self.out( "submitClicked", { submit: d, form: formData } );
		} );



		this.getForm().on("change keyup", ':input', function() {

			var formData = self.getFormData();
			self.out( "formChanged", { form: formData } );
		} );

		this.setExtraEvents();
	}

	module.prototype.getForm = function() {
		return this.getDom().find('form');
	};

	module.prototype.getFormData = function() {
		return this.getForm().serializeObject();
	};

	module.prototype.setExtraEvents = function() {};

	module.prototype.fill = function( data ) {
		this.populate( data );
	}

	module.prototype.populate = function( data ) {
		this.getForm().populate( data );
	}
	module.prototype.setHtml = function( html ) {
		this.getForm().html( html );
	}

	module.prototype.in = {

		"formData": function( data ) {
			this.fill( data );
		},

		"formHtml": function( html ) {
			this.setHtml( html );
		}
	};

	module.prototype.setStatus = function( status ) {

		if( status.formHtml ) {
			this.setHtml( status.formHtml );
		}

		if( status.formData ) {
			this.fill( status.formData );
		}
	}

	return module;

} );
