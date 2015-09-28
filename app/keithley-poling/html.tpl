

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
	<td class="label">Peak voltage:</td>
	<td>
		<input name="peakVoltage" /> V
	</td>
</tr>


<tr>
	<td class="label">Peak time:</td>
	<td>
		<input name="peakTime" /> s
	</td>
</tr>



<tr>
	<td class="label">Relaxation time:</td>
	<td>
		<input name="relaxationTime" /> s
	</td>
</tr>


<tr>
	<td class="label">Number of repeations:</td>
	<td>
		<input name="nbIterations" /> s
	</td>
</tr>

</table>

<input type="submit" value="Measure" />
</form>
</div>
