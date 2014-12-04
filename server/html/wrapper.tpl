<div class="wrapper {% if frame %}frame{% endif %}" style="top: {{ position.top }}px; left: {{ position.left }}px; width: {{ size.width }}px; height: {% if size.height %}{{ size.height }}px;{% endif %}">

<div class="title">{{ title }}</div>
<div class="content">

{% for module in html %}
	{{ module }}
{% endfor %}

</div>
</div>
<script type="text/javascript" language="javascript">

{% for module in js %}
	{{ module }}
{% endfor %}

</script>