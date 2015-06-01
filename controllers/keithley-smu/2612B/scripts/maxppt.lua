
function MPPTracking( smu )

  local pointIterator = 0
  local pointIteratorLocal
  local currentV = 1
  local deltaV = 1e-3
  local deltaVSign = -1
  local stime = 0.01 -- 100Hz measurement, 10Hz sweep

  local totaltime = 1 -- 10 seconds

  local nbSweeps = math.ceil( totaltime / ( stime * 10 ) )

  nbSweeps = 120
  local sdelay = 0
  local points = 10
  local sweep
  local maxPower = 0
  local maxPowerIndex = 0

  local sumP = 0
  local sumT = 0
  local slope
  local sumX
  --display.smub.measure.func = display.MEASURE_DCAMPS


  smu.source.func = smu.OUTPUT_DCVOLTS
  smu.source.rangev = 2
  smu.source.levelv = currentV

  display.smub.measure.func = display.MEASURE_DCAMPS


  smu.source.limiti = 0.1
  smu.source.rangei = 0.1

  smu.source.autorangei = smu.AUTORANGE_OFF
  smu.source.autorangev = smu.AUTORANGE_OFF
  smu.measure.autozero = smu.AUTOZERO_OFF

  smu.nvbuffer1.clear()
  smu.nvbuffer1.appendmode = 1
  smu.nvbuffer1.collectsourcevalues = 1
  smu.nvbuffer1.collecttimestamps = 0

  smu.nvbuffer2.clear()
  smu.nvbuffer2.appendmode = 1
  smu.nvbuffer2.collectsourcevalues = 0
  smu.nvbuffer2.collecttimestamps = 1


  smu.source.output = smu.OUTPUT_ON

  delay( sdelay )


  for sweep = 1, nbSweeps do

    sumP = 0
    sumT = 0

    for pointInteratorLocal = 1, points do

      smu.source.levelv = currentV

      delay( stime )

      smu.measure.i( smu.nvbuffer1 )
      smu.measure.p( smu.nvbuffer2 )

      pointIterator = pointIterator + 1

      currentV = currentV + deltaV * deltaVSign

      sumP = sumP + smu.nvbuffer2[ pointIterator ]
      sumT = sumT + smu.nvbuffer2.timestamps[ pointIterator ]
    end

    sumP = sumP / 10
    sumT = sumT / 10

    slope = 0
    sumX = 0

    for pointIteratorLocal = 1, points do
      slope = slope + ( smu.nvbuffer2.timestamps[ pointIterator - 10 + pointIteratorLocal ] - sumT ) * ( smu.nvbuffer2[ pointIterator - 10 + pointIteratorLocal ] - sumP )
      sumX = sumX + math.pow( ( smu.nvbuffer2.timestamps[ pointIterator - 10 + pointIteratorLocal ] - sumT ), 2 )
    end

    slope = slope / sumX

    if( slope > 0 ) then
     deltaVSign = deltaVSign * -1
    end

  end

  errorqueue.clear();
  printbuffer(1, pointIterator - 1, smu.nvbuffer1, smu.nvbuffer1.sourcevalues, smu.nvbuffer2.timestamps )


end
