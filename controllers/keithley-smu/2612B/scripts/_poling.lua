

function Poling(channel, peakVoltage, peakTime, relaxationTime, nbIterations)
local iterationNum = 0
local settlingTime = 0.1

local iterator
local nbTot = 0
local nbPointsPeak
local nbPointsRelaxation
if channel == nil then
	channel = smua
end
if peakVoltage == nil then
	peakVoltage = 10
end
if peakTime == nil then
	peakTime = 2
end
if relaxationTime == nil then
	relaxationTime = 5
end
if nbIterations == nil then
	nbIterations = 10
end
nbPointsPeak = peakTime / settlingTime
nbPointsRelaxation = relaxationTime / settlingTime
 --	display.settext( nbPointsRelaxation = relaxationTime / settlingTime
channel.nvbuffer1.clear()	-- Setup a buffer to store the result(s) in and start testing.
channel.nvbuffer1.appendmode = 1
channel.nvbuffer1.collecttimestamps = 1	 -- Put source values in buffer as well ie Volts
channel.source.output = channel.OUTPUT_ON


channel.source.rangev=20

for iterationNum = 1, nbIterations do
channel.source.limiti = 1
if iterationNum - math.floor( iterationNum / 2) * 2 == 0 then
   

channel.source.levelv= peakVoltage
    else
channel.source.levelv= -peakVoltage

end
    
channel.source.func = channel.OUTPUT_DCVOLTS

for iterator = 1,nbPointsPeak do
channel.measure.v(channel.nvbuffer1)	 -- Measure current and store reading in buffer.	
nbTot = nbTot + 1
delay(settlingTime)
end
channel.source.rangei = 0.0001
channel.source.limiti = 1e-7
channel.source.autorangei = channel.AUTORANGE_ON
channel.source.leveli = 0
channel.source.func = channel.OUTPUT_DCAMPS

for iterator = 1,nbPointsRelaxation do
	channel.measure.v(channel.nvbuffer1)	 -- Measure current and store reading in buffer.	
	nbTot = nbTot + 1
end
end
display.settext( tostring( nbTot ) )
channel.source.output = channel.OUTPUT_OFF
 --	printbuffer (1,nbTot,channel.nvbuffer1,channel.nvbuffer1.sourcevalues)
printbuffer (1,nbTot,channel.nvbuffer1.readings)

end
