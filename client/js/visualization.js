var VisualizationView = Backbone.View.extend({
	template: _.template(' \
		<div class="visualizationContainer">\
			<div class="visualizationHeader"><span style="float: left; margin-right: 20px;">Visualizations</span><span style="margin-left: 20px;" id="remove">close</span></div> \
			<div class="visualizationFormContainer" id="visualizationFormContainer"> \
				<div class="toolButton" id="visualizeButton">Visualize</div>\
			</div> \
			<div id="chart" style="float: right; width: 80%;"> \
				<svg style="height:500px"> </svg> \
			</div> \
		</div> \
	'),
	events: {
		"click #visualizeButton" : function() {
			nv.addGraph(function() {
				var chart = nv.models.discreteBarChart()
					.x(function(d) { return d.label })    //Specify the data accessors.
					.y(function(d) { return d.value })
					.staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
					.tooltips(true)        //Don't show tooltips
					.showValues(true)       //...instead, show the bar value right on top of each bar.
					.transitionDuration(700)
					;

				d3.select('#chart svg')
					.datum(generateBarGraph())
					.call(chart);

				nv.utils.windowResize(chart.update);

				return chart;
			});
		},
		"click #visualizationColumnButton" : "visualizeColumn",
		"click #remove" : function() {
			$($('.visualizationContainer')[0]).parent().remove();
		}
	},
	visualizeColumn: function(e) {
		console.log(e);

	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template({ bindList: bindList }));
		$('body').append(this.$el);
		var table = '<div id="visualizationTableColumns">';
		for (var i in tables[0].tableColumns) {
			if (tables[0].tableColumns[i].indexOf('[') !== -1) { continue; } // throw out object children
			table += '<div class="visualizationColumnButton">' + tables[0].tableColumns[i] + '</div><br>';
		}
		table += '</div>';

		$('#visualizationFormContainer').append(table);
		console.log(table);


		console.log(this.$el);
	}
});

//Each bar represents a single discrete quantity.
function exampleData() {
	return  [
		{
			key: "Cumulative Return",
			values: [
				{
					"label" : "A Label" ,
					"value" : -29.765957771107
				} ,
				{
					"label" : "B Label" ,
					"value" : 0
				} ,
				{
					"label" : "C Label" ,
					"value" : 32.807804682612
				} ,
				{
					"label" : "D Label" ,
					"value" : 196.45946739256
				} ,
				{
					"label" : "E Label" ,
					"value" : 0.19434030906893
				} ,
				{
					"label" : "F Label" ,
					"value" : -98.079782601442
				} ,
				{
					"label" : "G Label" ,
					"value" : -13.925743130903
				} ,
				{
					"label" : "H Label" ,
					"value" : -5.1387322875705
				}
			]
		}
	];
}

function generateBarGraph() {
	var strings = [];
	var tableColumnNum = 0;
	var skipColumns = 0;
	for (var i in tables[0].tableColumns) {
		console.log(tables[0].tableColumns[i]);

		if (tables[0].tableColumns[i].indexOf('[') !== -1) {
			skipColumns++;
		}
		if (tables[0].tableColumns[i] === "sentiment") {
			console.log(i);
			tableColumnNum = i - skipColumns;
		}
	}

	for (i in resultData.results) {
		if (resultData.results[i][tableColumnNum] in strings) {
			strings[resultData.results[i][tableColumnNum]].value++;
		} else {
			strings[resultData.results[i][tableColumnNum]] = {
				'label' : resultData.results[i][tableColumnNum],
				'value' : 1
			};
		}
	}

	var values = [];
	for (i in strings) {
		values.push(strings[i]);
	}

	return [
		{
			'key': "Sentiment",
			'values' : values
		}
	];
}