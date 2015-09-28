
var experiment = require("app/experiment");
  

var html = "";


html += "<h4>Obis 660</h4>";

html += '<div class="form-group">';
html += '<label for="power" class="col-sm-2 control-label">Power</label>';
  html += '<div class="input-group col-sm-10">';
    html += '<input type="number" class="form-control" min="0" max="100" step="0.1" value="0" id="power" name="power" placeholder="0" />';

    html += '<div class="input-group-addon">%</div>';

  html += '</div>';
html += '</div>';


html += '<div class="form-group">';
  html += '<div class="col-sm-offset-2 col-sm-10">';
  html += '<div class="checkbox"><label><input type="checkbox" id="on" name="on" /> Turn on</label></div>';
html += '</div>';
html += '</div>';



html += '<div class="form-group">';
  html += '<div class="col-sm-offset-2 col-sm-10">';
  html += '<input type="button" class="btn btn-primary" value="Validate" />';
   html += '</div>';
html += '</div>';


module.exports = html;
