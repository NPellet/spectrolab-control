
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

	streamOn: {

		'change': function( val ) {

			this.sampleInfos = val;
			this.emit("sampleInfoChange", val );


		}
	},

	getSampleInfo: function() {
		return this.sampleInfos;
	}
});

exports = module.exports = {
	Constructor: KeithleyMeasureVoc
}