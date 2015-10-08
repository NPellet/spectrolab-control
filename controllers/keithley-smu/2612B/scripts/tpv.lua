function tpv( smu, npoints, ncycles, delaybetweenpoints , v )

	local smu = smub
	-- Getting ready to trigger from function generator

	digio.trigger[1].mode = digio.TRIG_RISINGA -- Detects the rising edge
	digio.trigger[1].clear() -- Clear the current value

	smu.nvbuffer1.collecttimestamps = 1
	smu.measure.nplc = 0.001
	smu.trigger.source.stimulus = digio.trigger[1].EVENT_ID

	smu.trigger.measure.stimulus = digio.trigger[1].EVENT_ID
	smu.trigger.measure.v( smu.nvbuffer1 )
	smu.trigger.measure.action = smu.ENABLE
	smu.trigger.source.action = smu.ENABLE

	smu.measure.count = npoints;
	smu.measure.interval = delaybetweenpoints;

	smu.trigger.initiate()
	smu.trigger.source.listi({0})
	smu.trigger.count = ncycles

	trigInput = digio.trigger[1].wait( 10 );

	if trigInput == true then
		
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
