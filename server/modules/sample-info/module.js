
var moduleProto = require('../../module'),
	extend = require('extend');

var KeithleyMeasureVoc = function() {
	this.title = "IV Sweep parameters";
	this.sampleInfos = {};
};

KeithleyMeasureVoc.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;
		this.sweepEnd = [];

		return this;
	},

	streamIn: function( message ) {

		var module = this;

		if( message.method ) {

			switch( message.method ) {

				case 'change':

					var val = message.value;
					this.sampleInfos = val;
					this.emit("sampleInfoChange", val );

				break;
			}
		}
	},

	getSampleInfo: function() {
		return this.sampleInfos;
	}
});

exports = module.exports = {
	Constructor: KeithleyMeasureVoc
}