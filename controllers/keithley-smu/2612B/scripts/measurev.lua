function measurevoc( channel, stime, level, complianceV )

	local pt
	local pts = 50

	local voltage = 0

	if channel == nil then channel = smua end	-- Default to smua if no smu is specified.
	if stime == nil then stime = 0.04 end	-- Default settlingtime = 0.04 s
	if level == nil then level = 0 end	-- Default level = 0A
	if complianceV == nil then complianceV = 5 end	-- Default level = 0A

	channel.source.func = channel.OUTPUT_DCAMPS
	channel.source.output = channel.OUTPUT_ON
	channel.source.leveli = level
	channel.source.autorangei = channel.AUTORANGE_ON

	channel.source.limitv = complianceV
	channel.source.rangev = complianceV

	display.smub.measure.func = display.MEASURE_DCVOLTS;

	delay( stime )

	for pt = 1, pts do
		delay( 0.0001 )
		voltage = voltage + channel.measure.v()
	end


	channel.source.output = channel.OUTPUT_OFF
	printnumber( voltage / pts )	-- Binary output
end
