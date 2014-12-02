<div class="module {% if locked %} locked{% endif %} {{ type }}" id="module-{{ id }}">

{% if title %}
	<div class="title">{{ title }}</div>
{% endif %}

{{ content }}
</div>