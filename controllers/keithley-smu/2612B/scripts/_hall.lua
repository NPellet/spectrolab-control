
function HallMeasurement(smu, bias)-- RESISTANCE()

	if smu == nil then smu = smua end-- Default to smua if no smu is specified.
	local l_s_func = smu.source.func
	local l_s_leveli = smu.source.leveli-- Save settings in temporary variables so they can be restored at the end.
	local l_s_limitv = smu.source.limitv
	local l_s_rangei = smu.source.rangei
	local l_s_rsens = smu.sense
	local l_d_screen = display.screen

	display.clear()-- Clear the front panel display then prompt for input parameters if missing.

	points = 100

--	display.settext("Resistance")-- Update display with test info.
	smu.source.func = smu.OUTPUT_DCAMPS
	smu.source.rangei = bias
	smu.source.leveli = bias
	smu.source.limitv = 20

	
	smu.sense = smu.SENSE_REMOTE
	

	smu.measure.count = points 			-- # of Triggers
	smu.measure.autorangev = smu.AUTORANGE_ON
	smu.nvbuffer1.clear()				-- Setup a buffer to store the result(s) in and start testing.
	smu.nvbuffer1.appendmode = 1
	smu.nvbuffer1.collecttimestamps = 1
	smu.source.output = smu.OUTPUT_ON
	smu.measure.r(smu.nvbuffer1) 		-- Measure current and store in buffer, governed by # of counts.    
	smu.source.output = smu.OUTPUT_OFF
--	display.setcursor(2,1)				-- Update the front panel display and restore modified settings.
--	display.settext("Test complete")


	smu.source.rangei = l_s_rangei
	smu.source.leveli = l_s_leveli
	smu.sense = l_s_rsens
	printbuffer (1,points,smu.nvbuffer1.readings)
	display.clear()
	display.screen = l_d_screen
end