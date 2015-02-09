function SineAmperemetryIV(smu,sens,bias,level,complianceI,complianceV,stime,nplc,points) -- SINEAMPEREMETRY
	if smu == nil then smu = smua end									-- Default to smua if no smu is specified.
	local l_s_leveli = smu.source.leveli								-- Save settings in temporary variables so they can be restored at the end.
	local l_s_rangei = smu.source.rangei
	local l_s_autorangei = smu.source.autorangei
	local l_s_func = smu.source.func
	local l_m_autozero = smu.measure.autozero
	local l_m_filter = smu.measure.filter.enable
	local l_d_screen = display.screen
	local l_j, l_tonwm												-- Temporary variables used by this function.
	display.clear()													-- Clear the front panel display then prompt for input parameters if missing.
	
	ilist = {}
	for l_j = 1,points do
		ilist[l_j] = bias + level * math.sin(l_j * math.pi / 9)
	end

	

	display.settext("Sine Function")								-- Update display with test info.
	if sens == "Current" then
	smu.source.func = smu.OUTPUT_DCVOLTS
	smu.source.autorangev = smu.AUTORANGE_OFF
	smu.source.levelv = bias
	smu.source.rangev = complianceV
	smu.measure.rangei = complianceI
	smu.source.limiti = complianceI
	else
	smu.source.func = smu.OUTPUT_DCAMPS
	smu.source.autorangei = smu.AUTORANGE_OFF
	smu.source.leveli = bias
	smu.source.rangei =complianceI
	smu.measure.rangev = complianceV
	smu.source.levelv = complianceV
	end
	smu.measure.autozero = smu.AUTOZERO_ONCE
	smu.measure.filter.enable = smu.FILTER_OFF
	smu.measure.nplc = nplc											-- Integration time
	smu.nvbuffer1.clear()											-- Setup a buffer to store the result(s) in and start testing.
	smu.nvbuffer1.appendmode = 1
	smu.nvbuffer1.collecttimestamps = 1
	smu.nvbuffer1.collectsourcevalues = 1
	smu.source.output = smu.OUTPUT_ON
	if sens == "Current" then
      	for l_j = 1,points do
	smu.source.levelv = ilist[l_j]										-- Program source to sweep level.
	delay(stime)													-- Wait desired settling time.
	smu.measure.i(smu.nvbuffer1)									-- Measure current and store reading in buffer.
	end
	else
      	for l_j = 1,points do
	smu.source.leveli = ilist[l_j]										-- Program source to sweep level.
	delay(stime)													-- Wait desired settling time.
	smu.measure.v(smu.nvbuffer1)									-- Measure voltage and store in reading buffer.
	end
	end
	smu.source.output = smu.OUTPUT_OFF
	display.setcursor(2,1)											-- Update the front panel display and restore modified settings.
	display.settext("Test complete.")								-- Line 2 (32 characters max)
	smu.source.leveli = 0
	smu.source.rangei = l_s_rangei
      	smu.source.autorangei = l_s_autorangei 
	smu.source.func = l_s_func
	smu.source.leveli = l_s_leveli
	smu.measure.autozero = l_m_autozero
	smu.measure.filter.enable = l_m_filter
	printbuffer (1,points,smua.nvbuffer1.readings,smua.nvbuffer1.sourcevalues,smua.nvbuffer1.timestamps)
	delay(2)
	display.clear()
	display.screen = l_d_screen
end