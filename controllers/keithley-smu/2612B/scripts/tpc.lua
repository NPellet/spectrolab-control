function tpc( smu, npoints, ncycles, nplc , tdelay )

	local smu = smub
	--local current
	-- Getting ready to trigger from function generator

	digio.trigger[1].mode = digio.TRIG_RISINGA -- Detects the rising edge
	digio.trigger[1].clear() -- Clear the current value

  	smu.source.func = smu.OUTPUT_DCVOLTS
  	smu.source.output = smu.OUTPUT_ON
	smu.source.rangev = 100e-3
	smu.source.limitv = 100e-3
	smu.source.levelv = 0;
	smu.source.limiti = 10e-3

  	smu.measure.autorangei = smu.AUTORANGE_ON
	display.smub.measure.func = display.MEASURE_DCAMPS

  	delay( 1 )
	current = smu.measure.i()
	delay( 2 )


	smu.measure.autorangei = smu.AUTORANGE_OFF
	smu.measure.rangei = math.min( 1e-7, current * 10 )
  	
  	--smu.source.output = smu.OUTPUT_OFF
	smu.source.offmode = smu.OUTPUT_ZERO

	display.clear();
	display.setcursor(1,1,0)
	display.settext("TPC in progress...");


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
	
	trigInput = digio.trigger[1].wait( 30 );

	if trigInput == true then
			
		local txtcurrent = tostring( current );
		local str;
		str = "(current:" .. txtcurrent .. ")";
		print(str);

		waitcomplete();
		printbuffer ( 1, ncycles * npoints, smu.nvbuffer1, smu.nvbuffer1.timestamps );
		print("keithley:end;");
	else

		
		print("NOTOK");
		exit();		
		print("keithley:end;");
end


end
