
function pulseAndSwitchDiogio(diodePin, pulseWidth, numberOfPulses, delay)

	local pulseNum = 1
	digio.writebit( switchPin, 0 )
	digio.writebit( diodePin, 0 )

	for pulseNum = 1, numberOfPulses do
		digio.writebit( diodePin, 1 )
		delay( pulseWidth )
		digio.writebit( diodePin, 0 )
		delay( delay )

	end

	print("method_done");

end
