
var module = require('modules/module'),
	util = require('/util');

var KeithleyConnect = function() {};

KeithleyConnect.prototype = $.extend( {}, module, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;
	},

	streamIn: function( message ) {

		var module = this;

		switch( message ) {

			case 'connect':

				module.streamOut( "pending" );

				module.keithley.connect( function() {

					module.streamOut( "connected" );
				} );
			break;

			case 'disconnect':

				module.streamOut( "pending" );

				module.keithley.disconnect( function() {

					module.streamOut( "disconnected" );
				});
				
			break;
		}
	}

});

module.exports = KeithleyConnect;