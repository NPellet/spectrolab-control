var experiment = require("app/experiment");

var arduino = experiment.getInstrument('arduino');
//var lights = arduino.getSunLevels();
var lights = [];
module.exports = function( multiple ) {



	var html = '';

	html += '<div class="form-group">';
	  html += '<label for="lights">Light levels</label>';
	  html += '<select ' + ( multiple ? ' multiple' : '' ) + ' name="lightLevels' + ( multiple ? '[]' : '') + '" class="form-control" id="lights">';

	for( var i in lights ) {
	  html += '<option value="' + i + '">' + lights[ i ] + ' sun</option>';
	}
	html += '<option value="-1">Dark</option>';

	html += '</select>';
	html += '</div>';

	return html;

};