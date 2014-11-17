
var moduleProto = require('../../module'),
	extend = require('extend');

var KeithleySourceV = function() {};

KeithleySourceV.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;
	},

	streamIn: function( message ) {

		var module = this;

		if( message.method ) {

			switch( message.method ) {

				case 'source':

					module.keithley.sourceV( message.value, function( current ) {

						module.streamOut( { message: 'current', value: current } );
					} );

				break;
			}
		}
	}
});

exports = module.exports = {
	Constructor: KeithleySourceV
}