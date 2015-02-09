

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
	<td class="label">Applied current:</td>
	<td>
		<input name="current" /> nA
	</td>
</tr>


<tr>
	<td class="label">Sourcing between probes</td>
	<td>
		
		<select name="source_1">
			<option value="1">1</option>
			<option value="2">2</option>
			<option value="3">3</option>
			<option value="4">4</option>
		</select>

		and 

		<select name="source_2">
			<option value="1">1</option>
			<option value="2">2</option>
			<option value="3">3</option>
			<option value="4">4</option>
		</select>
	</td>
</tr>




<tr>
	<td class="label">Measuring between probes</td>
	<td>
		
		<select name="measure_1">
			<option value="1">1</option>
			<option value="2">2</option>
			<option value="3">3</option>
			<option value="4">4</option>
		</select>

		and 

		<select name="measure_2">
			<option value="1">1</option>
			<option value="2">2</option>
			<option value="3">3</option>
			<option value="4">4</option>
		</select>
	</td>
</tr>



<tr>
	<td class="label">Magnet</td>
	<td>
		
		<select name="measure_1">
			<option value="none">None</option>
			<option value="n">N</option>
			<option value="s">S</option>
		</select>
	</td>
</tr>
</table>

<input type="submit" value="Measure" />
</form>
</div>
