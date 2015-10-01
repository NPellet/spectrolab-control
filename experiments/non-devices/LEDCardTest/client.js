
var fs = require('fs');

module.exports = {
	modules: {

	  config: {
	    title: "Configure",
	    path: 'display/form2',
	    width: 30,
	    height: 20,
	    top: 0,
	    left: 0
	  }
	},

	method: function( renderer ) {
		
		var html = fs.readFileSync( __dirname + "/form.html", "ascii" );

		renderer.getModule("config").setFormHtml( html );
		
	}

};
