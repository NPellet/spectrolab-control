<!doctype html>
<html>
<head>

<link rel="stylesheet" href="client/css/style.css" />
<script data-main="client/js/main" src="client/js/lib/requirejs/require.js" type="text/javascript"></script>
<!-- Outputs all the modules saved in nodejs memory -->
<link rel="stylesheet" href="_modules.css" />
<link rel="stylesheet" href="client/lib/bootstrap/dist/css/bootstrap.min.css" />
<!--<link rel="stylesheet" href="client/lib/bootstrap-treeview/src/css/bootstrap-treeview.css" />-->

<meta name="application-meta" data-serverip="{{ ip }}" />


{% for css in stylesheets %}
	<link rel="stylesheet" href="{{ css }}" />
{% endfor %}

</head>


<body>

<div id="container">
<div id="header">

<div id="header-main">
	<form class="form-inline">
		<div class="form-group">
			{{ experimentConfig.name }}
		</div>

		<div class="form-group">
			<input type="text" id="device-name" class="form-control" placeholder="Device name" />
		</div>

		<button type="button" id="run-experiment" class="btn btn-default">Run !</button>
		<button type="button" id="abort-experiment" class="btn btn-default" disabled="disabled">Abort</button>
		<button type="button" id="more-cfg" class="btn btn-default">More config</button>

	</form>
</div>

	<div id="more-cfg-pannel">

		<div class="col-md-3">

			<form class="form-horizontal">

			  <div class="form-group form-group-sm">
			    <label for="area" class="col-sm-4 control-label">Area</label>
			    <div class="col-sm-4 input-group">
			      <input type="text" class="form-control input-sm" id="area" placeholder="0.57">
			      <span class="input-group-addon">cm<sup>2</sup></span>
			    </div>
			  </div>

			  <div class="form-group form-group-sm">
			    <label for="area" class="col-sm-4 control-label">Thickness</label>
			    <div class="col-sm-4 input-group">
			      <input type="text" class="form-control input-sm" id="thickness" placeholder="300">
			      <span class="input-group-addon">nm</span>
			    </div>
			  </div>

			  <div class="form-group form-group-sm">
			    <label for="area" class="col-sm-4 control-label">Porosity</label>
			    <div class="col-sm-4 input-group">
			      <input type="text" class="form-control input-sm" id="porosity" placeholder="60">
			      <span class="input-group-addon">%</span>
			    </div>
			  </div>


			</form>

		</div>

		<div class="col-md-4">

			<div id="cfg-tree"></div>

			<form class="form">

			  	<div class="input-group">

		     		<input type="text" class="form-control" id="cfg-name" placeholder="">
		       		<div class="input-group-btn">
		       			<button type="button" id="cfg-newfolder" class="btn btn-default">New folder</button>
		       			<button type="button" id="cfg-remove" class="btn btn-default">Erase</button>
		       			<button type="button" id="cfg-load" class="btn btn-default">Load</button>
		        		<button type="button" id="cfg-save" class="btn btn-default" type="button">Save</button>
		      		</div>
		      	</div>

			  </form>
		</div>

	</div>
</div>

<div id="grid">
{% for wrapper in wrappers %}
	{{ wrapper }}
{% endfor %}
</div>


<div class="panel panel-default" id="console-pannel">
  <!-- Default panel contents -->
  <div class="panel-heading">Console</div>
  <!-- Table -->
  <table class="table table-condensed" id="console-head">
  <thead>
  	<tr>
  		<th class="time">Time</th>
  		<th class="message">Message</th>
  	</tr>
  	</thead>
  </table>
  <div id="console-main-wrapper">
  <table id="console-main" class="table table-condensed">
  	<tbody>
  	</tbody>
  </table>
  </div>
</div>
</div>

</body>


</html>
