
<div class="form-group">
  <label>Channel</label>
  <div class="input-group">

  <div class="radio-inline">
    <label>
      <input type="radio" name="channel"  value="1" checked>
      A
    </label>
  </div>
  <div class="radio-inline">
    <label>
      <input type="radio" name="channel" value="2">
      B
    </label>
  </div>
  </div>

</div>

<div class="form-group pulse-group">
  <label for="pulse">Pulse length</label>
  <div class="input-group">

    <span class="input-group-addon">
      <input  type="radio" name="fixed" value="pulse" checked="checked" class="fixed" aria-label=""> Fixed
    </span>

    <input type="number" class="form-control pulse" placeholder="Enter pulse length" id="pulse" name="pulse">
      
    <div class="input-group-btn">
      <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
        <span class="timebase-selected">ns</span>
        <input type="hidden" name="timebase_pulse" value="-9" class="timebase-selected-input" />
        <span class="caret"></span>
      </button>
        <ul class="dropdown-menu timebase" role="menu">
          <li data-val="-9"><a href="#">ns</a></li>
          <li data-val="-6"><a href="#">&#956;s</a></li>
          <li data-val="-3"><a href="#">ms</a></li>
          <li data-val="0"><a href="#">s</a></li>
        </ul>
    </div>


  </div>

</div>


<div class="form-group duty-group">
  <label for="dutycycle">Duty cycle</label>
  <div class="input-group">


    <span class="input-group-addon">
      <input type="radio" name="fixed" value="duty" class="fixed" aria-label=""> Fixed
    </span>

    <input type="number" class="form-control duty" placeholder="Enter duty cycle (0-99)" id="dutycycle" name="duty">
    <span class="input-group-addon">%</span>
  </div>
</div>


<div class="form-group period-group">
  <label for="period">Period</label>
  

  <div class="input-group">


    <span class="input-group-addon">
      <input type="radio" name="fixed" value="period" class="fixed" aria-label=""> Fixed
    </span>


    <input type="number" class="form-control period" placeholder="Enter period time" id="period" name="period">

    <div class="input-group-btn">
    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
      <span class="timebase-selected">ns</span>
      <input type="hidden" name="timebase_period" value="-9" class="timebase-selected-input" />

      <span class="caret"></span></button>
      <ul class="dropdown-menu timebase" role="menu">
        <li data-val="-9"><a href="#">ns</a></li>
        <li data-val="-6"><a href="#">&#956;s</a></li>
        <li data-val="-3"><a href="#">ms</a></li>
        <li data-val="0"><a href="#">s</a></li>
      </ul>
    </div>


  </div>

  
</div>

