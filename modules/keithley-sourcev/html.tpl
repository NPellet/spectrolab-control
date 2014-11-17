<div class="padded">

	<table>
		<tr><td>Voltage</td><td><input type="text" value="0" id="source-{{ module.id }}" /></td><td>V</td></tr>
		<tr><td>Channel</td><td><select id="channel-{{ module.id }}"><option value="smua">A</option><option value="smub">B</option></select></td><td></td></tr>
		<tr><td></td><td><input type="submit" value="Measure current" id="measure-{{ module.id }}" /></td><td></td></tr>
		<tr><td>Current</td><td><div id="current-{{ module.id }}"></div></td><td>A</td></tr>
	</table>
</div>