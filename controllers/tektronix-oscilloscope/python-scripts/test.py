import vxi11
instr =  vxi11.Instrument("169.254.116.155")
print(instr.ask("*IDN?"))
print(instr.ask("TRIGger:A:EDGE:SOUrce?"))
print(instr.ask("*IDN?"))

