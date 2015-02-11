<!doctype html>
<html>
<head>

<link rel="stylesheet" href="client/css/style.css" />
<script data-main="client/js/main" src="client/js/lib/requirejs/require.js" type="text/javascript"></script>
<!-- Outputs all the modules saved in nodejs memory -->
<link rel="stylesheet" href="_modules.css" />

<meta name="application-meta" data-serverip="{{ ip }}" />


{% for css in stylesheets %}
	<link rel="stylesheet" href="{{ css }}" />
{% endfor %}

</head>


<body>

{% for wrapper in wrappers %}
	{{ wrapper }}
{% endfor %}


</body>


</html>