<div class="module {% if locked %} locked{% endif %} {{ class }}" id="module-{{ id }}">

{% if title %}
	<div class="title">{{ title }}</div>
{% endif %}

{{ content }}
</div>