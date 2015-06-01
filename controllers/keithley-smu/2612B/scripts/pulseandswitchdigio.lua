
function pulseAndSwitchDigio(diodePin, switchPin, pulseWidth, numberOfPulses, delayBetweenPulses, delaySwitch)

	local pulseNum = 1
	digio.writebit( switchPin, 0 )
	digio.writebit( diodePin, 0 )


	for pulseNum = 1, numberOfPulses do
		digio.writebit( diodePin, 1 )
		delay( pulseWidth )
		digio.writebit( diodePin, 0 )
		delay( delaySwitch )
		digio.writebit( switchPin, 1 )
		delay( delayBetweenPulses - delaySwitch )
		digio.writebit( switchPin, 0 )
	end

	print("method_done:pulseAndSwitchDigio");

end
