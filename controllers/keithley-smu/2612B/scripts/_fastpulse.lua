
function longPulse(diodePin, pulseWidth, numberOfPulses, pulseDelay)

	local pulseNum = 1
	digio.writebit( diodePin, 0 )

	for pulseNum = 1, numberOfPulses do
		digio.writebit( diodePin, 1 )
		delay( pulseWidth )
		digio.writebit( diodePin, 0 )
		delay( pulseDelay )

	end

	print("method_done");

end
