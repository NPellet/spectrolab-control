function tpc( smu, npoints, ncycles, nplc , tdelay )

	local smu = smub
	--local current
	-- Getting ready to trigger from function generator

	digio.trigger[1].mode = digio.TRIG_RISINGA -- Detects the rising edge
	digio.trigger[1].clear() -- Clear the current value

  	smu.source.func = smu.OUTPUT_DCVOLTS
	smu.source.rangev = 100e-3
	smu.source.limitv = 100e-3
  	smu.source.output = smu.OUTPUT_ON

  	smu.measure.autorangei = smu.AUTORANGE_ON

  	delay( 1 )
	current = smu.measure.i()
--	smu.source.output = smu.OUTPUT_OFF	

	delay( 2 )

	smu.measure.autorangei = smu.AUTORANGE_OFF
  	

	smu.measure.rangei = math.min( 1e-7, current * 10 )

	smu.nvbuffer1.clear()
	smu.nvbuffer1.appendmode = 1
	smu.nvbuffer1.collecttimestamps = 1
	smu.measure.delay = tdelay

	smu.measure.nplc = nplc
	smu.trigger.source.stimulus = digio.trigger[1].EVENT_ID
	smu.trigger.measure.stimulus = digio.trigger[1].EVENT_ID

	smu.trigger.measure.i( smu.nvbuffer1 )
	smu.trigger.measure.action = smu.ENABLE
	smu.trigger.source.action = smu.ENABLE
	
	smu.measure.count = npoints;
	smu.measure.interval = 0;
	
	smu.trigger.count = 1
	smu.trigger.source.listv({0})
	
	smu.trigger.arm.count = ncycles

	smu.trigger.initiate()
	
	trigInput = digio.trigger[1].wait( 10 );

	if trigInput == true then
		
		print("(current:" . tostring( current ) . ")");

		waitcomplete();
		printbuffer ( 1, ncycles * npoints, smu.nvbuffer1, smu.nvbuffer1.timestamps );
		print("keithley:end;");
	else

		
		print("NOTOK");
		print("keithley:end;");

		exit();		
		print("keithley:end;");

end


end
