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

<div id="header">

	<div id="experiment" class="left">
		<span>Experiment:</span>
		<span class="experiment-name">
			{{ experimentConfig.name }}
		</span>
	</div>

	<div class="right">
		<div id="device-name">
			<span class="label">
				Device name :
			</span>
			<span class="name">
				<input type="text" class="device-name" />
			</span>
		</div>

		<div id="experiment-run">
			<span class="run">
				<input type="submit" value="Run Experiment" class="input-green" />
			</span>

			<span class="abort">
				<input type="submit" value="Abort Experiment" class="input-grey" disabled="disabled" />
			</span>

		</div>
	</div>
</div>


{% for wrapper in wrappers %}
	{{ wrapper }}
{% endfor %}


</body>


</html>
