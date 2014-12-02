
var moduleProto = require('../../module'),
	extend = require('extend');

var BiasLightControl = function() {
	this.title = "Bias light";
};

BiasLightControl.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;
		this.sweepEnd = [];

		return this;
	},

	streamIn: function( message ) {

		var module = this;

		if( message.method ) {

			switch( message.method ) {

				case 'biasselect':

					module._biases = message.value;

				break;
			}
		}
	},

	getModuleInfos: function() {
		var options = this._getModuleInfos();

		options.biases = [
			{ level: 0, value: 'dark' },
			{ level: 1, value: '1%' },
			{ level: 2, value: '5%' },
			{ level: 3, value: '10%' },
			{ level: 4, value: '20%' },
			{ level: 5, value: '50%' },
			{ level: 6, value: '100%' }
		];

		return options;
	},
});

exports = module.exports = {
	Constructor: BiasLightControl
}