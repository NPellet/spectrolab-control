


var html = "";

html += '<table>';
html += '<tr><th>Perturbation pulse</th><th>Test perturbation</th><th>Y scaling (V/div)</th><th>X scaling (us)</th><th>Capture from scope</th></tr>';

for( var i = 12; i >= 0; i -- ) {

    html += '<tr class="light_' + i + '">';
      html += '<td colspan="4">' + i + '</td>';
    html += '</tr>';

      html += '<tr>';
        html += '<td><input type="text" name="config[' + i + '][voltage][perturbation]" /></td>';
        html += '<td><input type="button" data-action="testIt" data-lightintensity="' + i + '" data-perturbationtype="voltage" value="Test it" /></td>';
        html += '<td><input type="text" readonly="readonly" style="width: 35px;" name="config[' + i + '][voltage][yscale]"></td>';
        html += '<td><input type="text" readonly="readonly" style="width: 35px;" name="config[' + i + '][voltage][xscale]"></td>';
        html += '<td><input type="button" data-action="captureFromScope" data-lightintensity="' + i + '" data-perturbationtype="voltage" value="Get from oscilloscope" /></td>';
      html += '</tr>';


      html += '<tr>';
        html += '<td><input type="text" name="config[' + i + '][current][perturbation]" /></td>';
        html += '<td><input type="button" data-action="testIt"  data-lightintensity="' + i + '" data-perturbationtype="current" value="Test it" /></td>';
        html += '<td><input type="text" readonly="readonly" style="width: 35px;" name="config[' + i + '][current][yscale]"></td>';
        html += '<td><input type="text" readonly="readonly" style="width: 35px;" name="config[' + i + '][current][xscale]"></td>';
        html += '<td><input type="button" data-action="captureFromScope" data-lightintensity="' + i + '" data-perturbationtype="current" value="Get from oscilloscope" /></td>';
      html += '</tr>';

}

html += '</table>';
html += '<input type="text" name="cfgname" value="default" /> <input type="button" data-action="save" value="Save pulse config" /> <input type="button" data-action="load" value="Load pulse config" />'

module.exports = html;
