function sourcev(channel,bias,stime,complianceV,complianceI)	-- SOURCEV()
	if channel == nil then channel = smua end	-- Default to smua if no smu is specified.
	if bias == nil then bias = 0 end	-- Default to 0.0 A
	if stime == nil then stime = 0.04 end	-- Default settlingtime = 0.04 s
	if complianceV == nil then complianceV = 1 end	-- Default compliance = 1 V
	channel.source.func = channel.OUTPUT_DCVOLTS
	channel.source.levelv=bias
	channel.source.rangev=complianceV
	channel.measure.rangei = complianceI
	channel.source.limiti = complianceI
	channel.source.output = channel.OUTPUT_ON
	delay(stime)
	current=channel.measure.i()
	channel.source.output = channel.OUTPUT_OFF
	printnumber (current)	-- Binary output
end