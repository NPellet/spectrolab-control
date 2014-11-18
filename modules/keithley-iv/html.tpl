
<div class="channel toggle-light"></div>


<div class="padded">



<table>
<tr>
	<td class="label">Source:</td><td>
	<select id="channel-{{ module.id }}">
		<option value="smua">Channel A</option>
		<option value="smub">Channel B</option>¨
	</select>
</td>

<td class="label">
Voltage
</td>
<td>
	<nobr>
		<input type="text" size="4" value="0" id="vstart-{{ module.id }}" /> V 
		- 
		<input type="text" value="1" id="vstop-{{ module.id }}" size="4" /> V
	</nobr>
</td>

</tr>
		
<tr><td class="label">Scan rate</td>
<td>
	<nobr>
		<input type="text" value="500" size="6" id="scanspeed-{{ module.id }}" /> mV/s
	</nobr>
</td>
<td class="label">
	Step
</td>
<td>
	<select id="step-{{ module.id }}">
		<option value="1">1mV</option>
		<option value="5">5mV</option>
		<option value="10">10mV</option>
		<option value="20" selected="selected">20mV</option>
		<option value="50">50mV</option>
		<option value="100">100mV</option>
	</select>
</td>



</tr>

<tr>
	<td class="label">Equilibration time</td>
	<td>
		<nobr>
			<input type="text" value="0" size="6" id="tdelay-{{ module.id }}" /> s
		</nobr>
	</td>

	<td class="label">
		Compliance
	</td>
	<td>

		<select value="0.2" id="icompliance-{{ module.id }}">
			<option value="0.005">5mA</option>
			<option value="0.01">10mA</option>
			<option value="0.02" selected="selected">20mA</option>
			<option value="0.05">50mA</option>
			<option value="0.1">100mA</option>
			<option value="0.2">200mA</option>
			<option value="0.5">500mA</option>
			<option value="1">1A</option>
		</select>

	</td>
</tr>
</table>

</div>
