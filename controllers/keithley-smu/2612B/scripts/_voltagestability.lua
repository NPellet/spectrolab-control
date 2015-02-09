function VoltageStability(channel, bias, settlingtime, totaltime, complianceV, complianceI)	-- VoltageStability()

	local l_j
	local points

	if channel == nil then channel = smua end	-- Default to smua if no smu is specified.
	if bias == nil then bias = 0 end	-- Default to smua if no smu is specified.
	if settlingtime == nil then settlingtime = 0.04 end	-- Default settlingtime = 0.04 s
	if totaltime == nil then totaltime = 10 end	-- Default total time = 10s
	if complianceI == nil then complianceI = 1 end	-- Default compliance = 1 A
	if complianceV == nil then complianceV = 1 end	-- Default compliance = 1 V

	points = ( totaltime / ( settlingtime ) ) + 1
	
	--printbuffer( 1, points, channel.nvbuffer1 )
	--channel.source.bias = bias
	
	channel.source.leveli = 0

	delay( settlingtime )

	channel.nvbuffer1.clear()
	channel.nvbuffer1.appendmode = 1

	channel.source.rangev = complianceV
	channel.source.limitv = complianceV

	channel.source.rangei = complianceI
	channel.source.limiti = complianceI	

 	channel.source.func = channel.OUTPUT_DCAMPS;
 	display.smub.measure.func = display.MEASURE_DCVOLTS;
	channel.source.output = channel.OUTPUT_ON;

	channel.source.autorangei = channel.AUTORANGE_ON
	channel.source.autorangev = channel.AUTORANGE_ON

	for l_j = 1, points do

		delay( settlingtime )

		channel.measure.v( channel.nvbuffer1 )
	
	end

	channel.source.output = channel.OUTPUT_OFF
	printbuffer( 1, points, channel.nvbuffer1 )
end

