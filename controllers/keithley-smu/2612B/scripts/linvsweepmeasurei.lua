

function LinVSweepMeasureI(smu,startv,stopv,stopv2,stepv,cycles,scanrate,sdelay,complianceI)

  local currV
  local direction = 1
  local switches = 0
  local cycle = 0
  local points = 1
  local stime = stepv / scanrate

  local pts


  smu.source.func = smu.OUTPUT_DCVOLTS
  smu.source.rangev = math.max(math.abs(stopv2), math.abs(stopv)) * 2
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
  smu.measure.nplc = 5

  delay(sdelay)

  local localpoints = 0
  pts = math.abs( stopv - startv ) / stepv + 1

  while true do 

    smu.source.levelv = currV -- Set voltage
    delay(stime) -- Settling time 
    smu.measure.i( smu.nvbuffer1 )

    points = points + 1
    localpoints = localpoints + 1

    if localpoints == pts then

      if cycle == cycles then 
        break
      end

      direction = direction * -1
      switches = switches + 1;

      localpoints = 0
      pts = math.abs( stopv - stopv2 ) / stepv

      if math.mod( switches, 2 ) == 0 then

        cycle = cycle + 1;

        if cycle == cycles then
          pts = math.abs( stopv2 - startv ) / stepv 
        end
      end

    end

    currV = currV + direction * stepv

  end


  smu.source.output = smu.OUTPUT_OFF
  smu.source.levelv = 0
  smu.measure.autozero = smu.AUTOZERO_AUTO

  printbuffer ( 1, points - 1, smu.nvbuffer1, smu.nvbuffer1.sourcevalues )
  print("keithley:end;");

end
