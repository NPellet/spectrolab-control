function LinVSweepMeasureI( smu )

local pointIterator
local pointIteratorStart
local pointIteratorLocal

local deltaV = 1e-3
local deltaVSign = 1
local stime = 0.1 -- 10Hz measurement, 1Hz sweep

local totaltime = 10 -- 10 seconds

local nbSweeps = math.ceil( totaltime / ( stime * 10 ) )
local startv = 1
local sdelay = 1

l_stepv = (stopv - startv) / (points - 1)
l_sweepv = startv

smu.source.func = smu.OUTPUT_DCVOLTS
smu.source.rangev = 2
smu.source.levelv = startv

smu.source.limiti = 0.1
smu.source.rangei = 0.1

smu.source.autorangei = smu.AUTORANGE_OFF
smu.source.autorangev = smu.AUTORANGE_OFF
smu.measure.autozero = smu.AUTOZERO_OFF

smu.nvbuffer1.clear()
smu.nvbuffer1.appendmode = 1
smu.nvbuffer1.collectsourcevalues = 1

smu.nvbuffer2.clear()
smu.nvbuffer2.appendmode = 1
smu.nvbuffer2.collectsourcevalues = 1

smu.source.output = smu.OUTPUT_ON

delay( sdelay )

for sweep = 1, nbSweeps do

    for pointInteratorLocal = 1, points do

      smu.source.levelv = currentV

      delay( stime )

      smu.measure.i( smu.nvbuffer1 )
      smu.measure.p( smu.nvbuffer2 )

      pointIterator = pointIterator + 1
      
      currentV = currentV + deltaV * deltaVSign
    end

    local maxPower = math.huge
    local maxPowerIndex = 0

    for pointIteratorLocal = 1, points do

      if( smu.nvbuffer2[ ( sweep - 1 ) * 10 + pointIteratorLocal ] < maxPower )
        maxPower = smu.nvbuffer2[ ( sweep - 1 ) * 10 + pointIteratorLocal ]
        maxPowerIndex = pointIteratorLocal
      end
    end

    if( maxPowerIndex < 10 )
      deltaVSign = deltaVSign * -1
    end


  printbuffer (1, points, smu.nvbuffer1,smu.nvbuffer1.sourcevalues)

end
