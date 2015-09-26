
define( [ "getmodule-display/form2"], function( defaultModule ) {

	var module = function() { }

	module.prototype = new defaultModule();
/*
	module.prototype.setExtraEvents = function() {

		var self = this;
		this.getInnerDom().on("change", "select[name=biastype]", function() {

			var v = $( this ).prop( 'value' );
			var val = self.getInnerDom().find('input[name=biasvalue]').next();

			switch( v ) {
				case 'v':
					val.html("mV");
				break;
				case 'i':
					val.html("mA");
				break;
			}

			
		} );
	}
	*/
	return module;

} );
