function applycurrent( channel, v )

	if channel == nil then channel = smua end	-- Default to smua if no smu is specified.
	if v == nil then v = 0.0 end

	channel.source.func = channel.OUTPUT_DCVOLTS
	channel.source.output = channel.OUTPUT_ON
	channel.source.autorangev = channel.AUTORANGE_ON
	channel.source.levelv = v
end
