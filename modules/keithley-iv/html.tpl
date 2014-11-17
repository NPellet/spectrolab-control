<div class="padded">

	<table>
		<tr><td>Channel</td><td><select id="channel-{{ module.id }}"><option value="smua">A</option><option value="smub">B</option></select></td><td></td></tr>
		<tr><td>Start voltage</td><td><input type="text" value="0" id="vstart-{{ module.id }}" /></td><td>V</td></tr>
		<tr><td>Stop voltage</td><td><input type="text" value="1" id="vstop-{{ module.id }}" /></td><td>V</td></tr>
		
		<tr><td>Scan speed</td><td><input type="text" value="500" id="scanspeed-{{ module.id }}" /></td><td>mV/s</td></tr>
		<tr><td>Voltage step</td><td>

			<select id="step-{{ module.id }}">
				<option value="1">1mV</option>
				<option value="5">5mV</option>
				<option value="10">10mV</option>
				<option value="20" selected="selected">20mV</option>
				<option value="50">50mV</option>
				<option value="100">100mV</option>
			</select>

		</td><td>mV</td></tr>


		<tr><td>Equilibration time</td><td><input type="text" value="0" id="tdelay-{{ module.id }}" /></td><td>s</td></tr>
		<tr><td>Current compliance</td>
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

		</td><td></td></tr>


		<tr><td></td><td><input type="submit" value="Measure current" id="measure-{{ module.id }}" /></td><td></td></tr>
	</table>
</div>
