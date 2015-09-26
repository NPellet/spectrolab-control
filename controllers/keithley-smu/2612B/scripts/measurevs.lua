function measurevs( smu, level, rangei, measuretime )

	local pt
	local pts = 50

	local tdelay = 0.2
	local points = 1

	local stime = 30

	local pts1 = stime / tdelay
	local pts2 = measuretime / tdelay

	if smu == nil then smu = smua end	-- Default to smua if no smu is specified.
	if level == nil then level = 0 end	-- Default level = 0A


	smu.source.rangei = 0.0005
	smu.source.autorangei = smu.AUTORANGE_ON
	smu.measure.autozero = smu.AUTOZERO_ON


	smu.nvbuffer1.clear()
	smu.nvbuffer1.appendmode = 1
	smu.nvbuffer1.collectsourcevalues = 1
	smu.measure.nplc = 6

	smu.source.func = smu.OUTPUT_DCAMPS
	smu.source.leveli = 0
	smu.source.output = smu.OUTPUT_ON

	display.smub.measure.func = display.MEASURE_DCVOLTS;


	for pt = 1, pts1 do
		delay( tdelay )
	    smu.measure.v( smu.nvbuffer1 )
	    points = points + 1
	end


	smu.source.leveli = level

	for pt = 1, pts2 * 2 do
		delay( tdelay )
	    smu.measure.v( smu.nvbuffer1 )
	    points = points + 1

	    if pt == pts2 then
	    
	    	smu.source.leveli = 0
	    end
	end

	smu.source.output = smu.OUTPUT_OFF

	smu.source.output = smu.OUTPUT_OFF
	smu.source.levelv = 0
	smu.measure.autozero = smu.AUTOZERO_AUTO

	printbuffer ( 1, points - 1, smu.nvbuffer1, smu.nvbuffer1.sourcevalues )
	print("keithley:end;");
end
