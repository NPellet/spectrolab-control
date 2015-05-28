
var html = "";

html += '<div class="form-group">';
html += '<label for="pulsetime">Pulse time</label>';
  html += '<div class="input-group">';
    html += '<input type="number" class="form-control" id="pulsetime" name="pulsetime" placeholder="Enter pulse time (s)" />';
    html += '<span class="input-group-addon">s</span>';
  html += '</div>';
html += '</div>';


html += '<div class="form-group">';
html += '<label for="delaytime">Delay time</label>';
  html += '<div class="input-group">';
    html += '<input type="number" class="form-control" id="delaytime" name="delaytime" placeholder="Enter delay time (s)" />';
    html += '<span class="input-group-addon">s</span>';
  html += '</div>';
html += '</div>';


html += '<div class="form-group">';
html += '<label for="vscale">Starting vertical scale</label>';
  html += '<div class="input-group">';
    html += '<select class="form-control" id="vscale" name="vscale"><option value="0.001">1 mV/div</option><option value="0.002">2 mV/div</option><option value="0.005">5 mV/div</option><option value="0.01">10 mV/div<option value="0.02">20 mV/div</option><option value="0.05">50 mV/div</option><option value="0.08">80 mV/div</option><option value="0.1">100 mV/div</option></option></select>';
  html += '</div>';
html += '</div>';


html += '<div class="form-group">';
html += '<label for="timebase">Time base</label>';
  html += '<div class="input-group">';
    html += '<input type="number" class="form-control" id="timebase" name="timebase" placeholder="Enter time base" />';
    html += '<span class="input-group-addon">&#956;s</span>';
  html += '</div>';
html += '</div>';


html += '<div class="form-group">';
html += '<label for="averaging">Number of averagings</label>';
  //html += '<div class="input-group">';
    html += '<input type="number" class="form-control" id="averaging" name="averaging" placeholder="Enter # of averages" />';
  //html += '</div>';
html += '</div>';


html += '<div class="form-group">';
html += '<label for="averagingblank">Number of blank averagings</label>';
  //html += '<div class="input-group">';
    html += '<input type="number" class="form-control" id="blankaveraging" name="blankaveraging" placeholder="Enter # of blank averages" />';
  //html += '</div>';
html += '</div>';


html += '<div class="form-group">';
html += '<label for="pulsechannel">Light channel on AFG</label>';
  html += '<div class="input-group">';
    html += '<label class="radio-inline"><input type="radio" name="pulsechannel" id="pulsechannel" value="1"> 1</label><label class="radio-inline"><input type="radio" name="pulsechannel" id="pulsechannel" value="2"> 2</label>';
  html += '</div>';
html += '</div>';



html += '<div class="form-group">';
html += '<label for="switchchannel">Switch channel on AFG</label>';
  html += '<div class="input-group">';
    html += '<label class="radio-inline"><input type="radio" name="switchchannel" id="switchchannel" value="1"> 1</label><label class="radio-inline"><input type="radio" name="switchchannel" id="switchchannel" value="2"> 2</label>';
  html += '</div>';
html += '</div>';



module.exports = html;
