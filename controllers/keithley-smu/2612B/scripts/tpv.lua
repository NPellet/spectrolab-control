function tpv( smu, npoints, ncycles, nplc , tdelay )

	local smu = smub
	-- Getting ready to trigger from function generator

	digio.trigger[1].mode = digio.TRIG_RISINGA -- Detects the rising edge
	digio.trigger[1].clear() -- Clear the current value

  	smu.source.func = smu.OUTPUT_DCAMPS
  	smu.source.output = smu.OUTPUT_ON
	smu.source.rangei = 100e-9
	smu.source.limiti = 100e-9
	smu.source.leveli = 0;
	smu.measure.rangev = 2;
	smu.source.limitv = 2;
	smu.source.rangev = 2;

	smu.source.offmode = smu.OUTPUT_HIGH_Z
	--smu.source.offfunc = smu.OUTPUT_DCAMPS
	
	display.smub.measure.func = display.MEASURE_DCVOLTS
  	smu.nvbuffer1.clear()
	smu.nvbuffer1.appendmode = 1
	smu.nvbuffer1.collecttimestamps = 1
	smu.measure.delay = tdelay

	display.clear();
	display.setcursor(1,1,0)
	display.settext("TPV in progress...");



	smu.measure.nplc = nplc
	smu.trigger.source.stimulus = digio.trigger[1].EVENT_ID

	smu.trigger.measure.stimulus = digio.trigger[1].EVENT_ID
	smu.trigger.measure.v( smu.nvbuffer1 )
	smu.trigger.measure.action = smu.ENABLE
	smu.trigger.source.action = smu.DISABLE

	smu.measure.count = npoints;
	smu.measure.interval = 0;
	
	
	smu.trigger.source.listi({0})
	smu.trigger.count = 1
	smu.trigger.arm.count = ncycles
	smu.trigger.initiate()
	
	trigInput = digio.trigger[1].wait( 30 );

	if trigInput == true then
		
		waitcomplete();
		printbuffer ( 1, ncycles * npoints, smu.nvbuffer1, smu.nvbuffer1.timestamps );
		print("keithley:end;");
	else
		print("NOTOK");
		exit();		
		print("keithley:end;");


end
end
