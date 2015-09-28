

<div data-path="{{ path }}" data-moduleid="{{ id }}" class="panel panel-primary {{ class }} module" style="top: {{ position.top }}px; left: {{ position.left }}px; width: {{ size.width }}px; height: {% if size.height %}{{ size.height }}px;{% endif %}">

	{% if title %}
	<div class="panel-heading">
			<h3 class="panel-title">{{ title }}</h3>
	</div>
	{% endif %}

	<div class="panel-body">
		{{ content }}
	</div>
</div>
