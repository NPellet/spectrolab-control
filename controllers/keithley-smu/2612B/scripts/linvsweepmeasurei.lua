function LinVSweepMeasureI(smu,startv,stopv,stopv2,stepv,cycles,scanrate,sdelay,complianceI)

  local currV
  local direction = math.abs( stopv - startv ) / ( stopv - startv )
  local switches = 0
  local cycle = 0
  local points = 0
  local stime = stepv / scanrate


  smu.source.func = smu.OUTPUT_DCVOLTS
  smu.source.rangev = math.max(math.abs(stopv2), math.abs(stopv))
  smu.source.levelv = startv

  currV = startv

  smu.source.limiti = 0.1
  smu.source.rangei = 0.1

  errorqueue.clear();
  smu.source.autorangei = smu.AUTORANGE_OFF
  smu.source.autorangev = smu.AUTORANGE_OFF
  smu.measure.autozero = smu.AUTOZERO_OFF
  smu.nvbuffer1.clear()
  smu.nvbuffer1.appendmode = 1
  smu.nvbuffer1.collectsourcevalues = 1
  smu.source.output = smu.OUTPUT_ON

  delay(sdelay)

  while true do 

    smu.source.levelv = currV -- Set voltage
    delay(stime) -- Settling time 
    smu.measure.i( smu.nvbuffer1 )
    points++

    if currV == stopv or currV == stopv2 then 
      direction *= -1
      switches++;

      if( switches % 2 == 0 ) then
        cycle++;
      end
    end


    if( currV == startv and switches % 2 == 0 and cycle == cycles)
      break
    end

    currV = currV + direction * mvperpoint

  end


  smu.source.output = smu.OUTPUT_OFF
  smu.source.levelv = 0
  smu.measure.autozero = smu.AUTOZERO_AUTO

  printbuffer ( 1, points, smu.nvbuffer1, smu.nvbuffer1.sourcevalues )

end
