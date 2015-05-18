
<div data-path="{{ path }}" data-moduleid="{{ id }}" class="panel panel-primary {{ class }} module">

	{% if title %}
	<div class="panel-heading">
			<h3 class="panel-title">{{ title }}</h3>
	</div>
	{% endif %}

	<div class="panel-body">
		{{ content }}
	</div>
</div>
