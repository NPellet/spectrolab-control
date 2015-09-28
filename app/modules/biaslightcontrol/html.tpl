
<div class="padded">


<div id="biases-{{ module.id }}">
{% for bias in biases %}
	<div>
		<input type="checkbox" data-bias="{{ bias.level }}" /> {{ bias.value }}
	</div>
{% endfor %}


</div>

</div>