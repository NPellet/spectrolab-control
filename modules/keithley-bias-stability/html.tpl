
<div class="padded">

	<form method="post" action="" name="someForm" id="control-{{ module.id }}">
		
		<table>
			<tr>
				<td class="label">Source:</td>
				<td>
					<select name="channel">
						<option value="smua">Channel A</option>
						<option value="smub">Channel B</option>¨
					</select>
				</td>

			</tr>


			<tr>

				<td class="label">
					Bias using
				</td>

				<td>
					<input type="radio" name="biastype" value="current" /> Current
					<input type="radio" name="biastype" value="voltage" /> Voltage
				</td>

			</tr>



			<tr>

				<td class="label">
					Bias value
				</td>

				<td>
					<input type="text" name="bias" value="0" /> <span id="biasunit-{{ module-id }}"></span>
				</td>

			</tr>


			<tr>
				<td class="label">
					Total time
				</td>
				<td>
					<nobr>
						<input type="text" size="10" value="0" name="totaltime" /> s
					</nobr>
				</td>


			</tr>

			<tr>
				<td class="label">
					Settling time
				</td>
				<td>
					<nobr>
						<input type="text" value="0.1" size="6" name="settlingtime" /> s
					</nobr>
				</td>

			</tr>

		</table>


		<input type="submit" value="Measure" name="submit" />

	</form>
</div>
