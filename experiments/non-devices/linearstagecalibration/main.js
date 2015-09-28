
var app = require("app/app");
var async = app.async();

var arduino = app.getInstrument('arduino-stage');

module.exports = function() {

	return arduino.calibrateLinearStage();
}
