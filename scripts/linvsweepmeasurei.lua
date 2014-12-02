function LinVSweepMeasureI(smu,startv,stopv,stime,sdelay,complianceI,points)
if smu == nil then smu = smua end
local l_s_levelv = smu.source.levelv
local l_s_rangev = smu.source.rangev
local l_s_autorangev = smu.source.autorangev
local l_s_func = smu.source.func
local l_m_autozero = smu.measure.autozero 
local l_d_screen = display.screen
local l_j, l_stepv, l_sweepv
if startv == nil then
startv = display.prompt("+00.000", " Volts", "Enter START voltage.", 0, -40, 40)
if startv == nil then AbortScript(l_d_screen) end
end
if stopv == nil then
istopv = display.prompt("+00.000", " Volts", "Enter STOP voltage.", 1, -40, 40)
if stopv == nil then AbortScript(l_d_screen) end
end
if stime == nil then
stime = display.prompt("+0.000E+00", " Seconds", "Enter SETTLING time.", 0, 0, 10)
if stime == nil then AbortScript(l_d_screen) end
end
if sdelay == nil then
sdelay = display.prompt("+0.000E+00", " Seconds", "Enter EQUILIBRATION time.", 0, 0, 20)
if sdelay == nil then AbortScript(l_d_screen) end
end
if points == nil then
points = display.prompt("0000", " Points", "Enter number of sweep POINTS.", 10, 1, 1000)
if points == nil then AbortScript(l_d_screen) end
end
l_stepv = (stopv - startv)/(points - 1)
l_sweepv = startv
smu.source.func = smu.OUTPUT_DCVOLTS
display.smua.measure.func = display.MEASURE_DCAMPS
      smu.source.levelv = startv
      smu.source.limiti = complianceI
      smu.source.rangev = math.max(math.abs(startv), math.abs(stopv))
      smu.measure.autozero = smu.AUTOZERO_ONCE
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

