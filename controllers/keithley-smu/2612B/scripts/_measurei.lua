function measurej( channel, stime )
	local pt
	local pts = 50

	local current = 0
	if channel == nil then channel = smua end	-- Default to smua if no smu is specified.
	if stime == nil then stime = 0.04 end	-- Default settlingtime = 0.04 s

	channel.source.func = channel.OUTPUT_DCVOLTS
	channel.source.output = channel.OUTPUT_ON
	channel.source.levelv = 0
	channel.source.autorangev = channel.AUTORANGE_ON
	display.smub.measure.func = display.MEASURE_DCAMPS;

	delay( stime )


	for pt = 1, pts do
		delay( 0.00001 )
		current = current + channel.measure.i()
	end


	channel.source.output = channel.OUTPUT_OFF
	printnumber( current / pts )	-- Binary output

end
