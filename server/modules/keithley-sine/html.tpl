

<div class="padded">


<form method="post" action="" name="someForm" id="hall-{{ module.id }}">
	
<table>
<tr>
	<td class="label">Channel:</td>
	<td>
		<select name="channel">
			<option value="smua">Channel A</option>
			<option value="smub">Channel B</option>¨
		</select>
	</td>
</tr>

<tr>
	<td class="label">Sense:</td>
	<td>
		<select name="sense">
			<option value="Current">Current</option>
			<option value="Voltage">Voltage</option>¨
		</select>
	</td>
</tr>


<tr>
	<td class="label">Bias:</td>
	<td>
		<input name="bias" value="0" />
	</td>
</tr>

<tr>
	<td class="label">Level:</td>
	<td>
		<input name="level" value="2" />
	</td>
</tr>


<tr>
	<td class="label">Settling time:</td>
	<td>
		<input name="settlingtime" value="0.001" />
	</td>
</tr>


<tr>
	<td class="label">Compliance I:</td>
	<td>
		<input name="complianceI" value="0.001" />
	</td>
</tr>


<tr>
	<td class="label">Compliance V:</td>
	<td>
		<input name="complianceV" value="2" />
	</td>
</tr>


<tr>
	<td class="label">NPLC:</td>
	<td>
		<input name="NPLC" value="0.01" />
	</td>
</tr>



<tr>
	<td class="label">Number of points:</td>
	<td>
		<input name="points" value="100" />
	</td>
</tr>

</table>

<input type="submit" value="Measure" />
</form>
</div>
