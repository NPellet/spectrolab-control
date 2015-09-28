<ul class="device-selection">
	{% for device in module.devices %}
		<li> {{ device.id }} </li>
	{% endfor %}
</ul>