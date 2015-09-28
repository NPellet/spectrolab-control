
var ModuleProto = require('../../../module'),
	extend = require('extend');

var DeviceSelector = function() {};

DeviceSelector.prototype = new ModuleProto();
DeviceSelector.prototype = extend( DeviceSelector.prototype, {

	streamOn: {
		// Comes from the UI
		'selectDevice': function( deviceId ) {
			
			var self = this;
			this.getExperiment().selectDevice( deviceId ).then( function( err ) {

				self.status.device = deviceId;

			} );



		}
	},


	setDevice: function( deviceId ) {

		this.status.deviceId = deviceId;
		this.out("selectDevice", this.status.color );

		return this;
	},

	_getModuleInfos: function() {

		return {
			module: {
				devices: experiment.getConfig().devices
			}
		};
	}

} );

exports = module.exports = {
	Constructor: ButtonDisplay
}
