
var experiment = require("app/experiment");
var arduino = experiment.getInstrument('arduino');

var lights = arduino.getSunLevels();
var speeds = [ '100', '10', '1', '0.5', '0.1', '0.05', '0.01', '0.005', '0.001' ]; // Down to 1mV/s

var html = "";

html += '<div class="form-group">';
html += '<label for="vStart">V<sub>start</sub></label>';
  html += '<div class="input-group">';
  html += '<div class="input-group-addon checkbox"><label style="min-height: initial;"><input type="checkbox" name="forcevstart"> Force </label></div>';
    html += '<input type="text" class="form-control" id="vStart" name="vstart" placeholder="Enter V start" />';
  html += '</div>';
html += '</div>';


html += '<div class="form-group">';
html += '<label for="vEnd">V<sub>end</sub></label>';
  html += '<div class="input-group">';
  html += '<div class="input-group-addon checkbox"><label style="min-height: initial;"><input type="checkbox" name="forcevend"> Force </label></div>';
    html += '<input type="text" class="form-control" id="vEnd" name="vend" placeholder="Enter V end" />';
  html += '</div>';
html += '</div>';


html += '<div class="form-group">';
html += '<label for="settlingTime">Settling time</label>';

  html += '<div class="input-group">'
    html += '<input type="text" class="form-control" id="settlingTime" name="settlingtime" placeholder="Enter here the settling time" />';
    html += '<div class="input-group-addon">s</div>';
  html += '</div>';

html += '</div>';


html += '<div class="form-group">';
  html += '<label for="lights">Light levels</label>';
  html += '<select multiple name="lightLevels[]" class="form-control" id="lights">';

for( var i in lights ) {
  html += '<option value="' + i + '">' + lights[ i ] + ' sun</option>';
}

html += '</select>';
html += '</div>';


html += '<div class="form-group">';
  html += '<label for="speeds">Scan speeds</label>';
  html += '<select multiple name="scanRates[]" class="form-control">';

for( var i = 0, l = speeds.length; i < l; i ++ ) {
  html += '<option value="' + speeds[ i ] + '">' + speeds[ i ] + ' V/s</option>';
}

  html += '</select>';

html += '</div>';

module.exports = html;
