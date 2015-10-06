<!doctype html>
<html>
<head>

<link rel="stylesheet" href="client/css/style.css" />
<link rel="stylesheet" href="client/css/main.css" />
<script data-main="client/js/main" src="client/js/lib/requirejs/require.js" type="text/javascript"></script>
<!-- Outputs all the modules saved in nodejs memory -->

<link rel="stylesheet" href="client/lib/bootstrap/dist/css/bootstrap.min.css" />
<!--<link rel="stylesheet" href="client/lib/bootstrap-treeview/src/css/bootstrap-treeview.css" />-->

<meta name="application-meta" data-serverip="{{ ip }}" />


{% for css in stylesheets %}
	<link rel="stylesheet" href="{{ css }}" />
{% endfor %}

</head>


<body>

	<div id="container">


		<div id="leftpannel" class="col-sm-4">
			{% include leftpannel.tpl %}
		</div>

		<div id="grid" class="col-sm-8">

			<div id="header">

				<div id="header-main">
					<form class="form-inline">
						<button type="button" id="run-experiment" class="btn btn-default">
							Run
						</button>

						<button type="button" data-toggle="modal" data-target="#modal-loadmethods" class="btn btn-default">
							Load methods
						</button>

						<button type="button" id="erase-methods" class="btn btn-default">
							Erase methods
						</button>

					</form>

				</div>

			</div>

			<div id="grid-content">

			</div>


		</div>

		<div id="bottompannel">
			{% include bottompannel.tpl %}
		</div>

	</div>

	<div id="hidden">
		{% include modal/addmethod %}	
		{% include modal/configuremethod %}		
		{% include modal/loadmethods %}		
		{% include modal/modal %}		
	</div>
</body>
	

</html>
