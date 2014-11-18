<!doctype html>
<html>
<head>


<link rel="stylesheet" href="public/css/style.css" />
<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script src="./public/js/jsgraph.min.js"></script>
<script src="./public/js/io.js"></script>
<script src="./public/js/lock.js"></script>
<script src="./public/js/main.js"></script>


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