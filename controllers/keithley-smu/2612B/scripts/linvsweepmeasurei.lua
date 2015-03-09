function LinVSweepMeasureI(smu,startv,stopv,stime,sdelay,complianceI,points)
if smu == nil then smu = smua end
local l_s_levelv = smu.source.levelv
local l_s_rangev = smu.source.rangev
local l_s_autorangev = smu.source.autorangev
local l_s_func = smu.source.func
local l_m_autozero = smu.measure.autozero
local l_d_screen = display.screen
local l_j, l_stepv, l_sweepv


l_stepv = (stopv - startv)/(points - 1)
l_sweepv = startv
smu.source.func = smu.OUTPUT_DCVOLTS
--display.smua.measure.func = display.MEASURE_DCAMPS
      smu.source.levelv = startv

      smu.source.rangev = math.max(math.abs(startv), math.abs(stopv))


  smu.source.rangev = 2
  smu.source.levelv = 2

	smu.source.limiti = 0.1
    smu.source.rangei = 0.1

      smu.measure.autozero = smu.AUTOZERO_ONCE

    smu.source.autorangei = smu.AUTORANGE_OFF
	smu.source.autorangev = smu.AUTORANGE_OFF

	smu.nvbuffer1.clear()
	smu.nvbuffer1.appendmode = 1
	smu.nvbuffer1.collectsourcevalues = 1
	smu.source.output = smu.OUTPUT_ON




delay(sdelay)

for l_j = 1,points do
smu.source.levelv = l_sweepv
delay(stime)
smu.measure.i(smu.nvbuffer1)
l_sweepv = l_sweepv + l_stepv
end


smu.source.output = smu.OUTPUT_OFF
smu.source.levelv = 0

printbuffer (1,points,smu.nvbuffer1,smu.nvbuffer1.sourcevalues)
end
