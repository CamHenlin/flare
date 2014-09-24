
var QueryView = Backbone.View.extend({
	tagName: 'span',
	template: _.template(' \
		<div class="queryWindow"> \
			<div style="float: left;"> \
				<div id="runQuery">run query</div><br /> \
				<div id="visualizeQuery">visualize</div><br /> \
				<div id="resultCount" class="" style="float: left; width: 75px; margin-left: 10px;"></div> \
			</div> \
			<div class="queryResults" id="queryResults"></div> \
		</div> \
	'),
	events: {
		'click #runQuery' : 'runQuery',
		'click #visualizeQuery' : function() {
			new VisualizationView({});
		}
	},
	runQuery: function() {
		$('body').append('<div id="loading" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px; z-index: 1000; background: #fff; opacity: 0.5; text-align: center;"><img style="top: 600px; opacity: 1; width: 60%; image-rendering: -webkit-optimize-contrast;" src="loading.gif" /></div>');
		var postData = { 'bindings' : [] };
		var i = 0;
		var tableTitle;
		bindList.forEach(function(binding) {
			var from = {
				'tableName': findTableTitle(binding.from),
				'tableColumn': $(binding.from).attr('data-binding-col-title')
			};

			var type = '';
			var el = binding.to;
			while (type === '') {
				console.log(el);
				if ($(el).attr('class').indexOf('filter') > -1) {
					type = 'filter';
				} else if ($(el).attr('class').indexOf('similarity') > -1) {
					type = 'similarity';
					tables[0].tableColumns.push(type);
				} else if ($(el).attr('class').indexOf('sentiment') > -1) {
					type = 'sentiment';
					tables[0].tableColumns.push(type);
				} else {
					console.log($(el).attr('class'));
				}

				el = $(el).parent()[0];
			}

			var to = {
				'type': type,
				'query': (i === 0) ? $(binding.to).parent().find('#filterBy').val() : $(binding.to).parent().parent().find('#similarityString').val()
			};

			postData.bindings.push({
				'from': from,
				'to': to
			});

			i++;
		});

		console.log(postData);
		$.ajax({
			url: baseurl + 'query',
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			data: JSON.stringify(postData, null, '\t'),
			success: function(data) {
				//tdata = JSON.parse(tdata);
				console.log(data);
				resultData = data;
				// $('#queryResults').append(JSON.stringify(data.results));

				$('#resultCount').text(data.results.length + ' results');
				var table = '<table id="outtable"><tr>';
				for (var i in tables[0].tableColumns) {
					if (tables[0].tableColumns[i].indexOf('[') !== -1) { continue; } // throw out object children
					table += '<th>' + tables[0].tableColumns[i] + '</th>';
				}
				table += '</tr>';
				for (i in data.results) {
					result = data.results[i];
					var row = '<tr>';
					$('#outtable').append('<tr>');
					for (var j in result) {
						row += '<td class="queryResult">' + JSON.stringify(result[j]) + '</td>';
					}
					table += row + '</tr>';
				}
				console.log(table);
				$('#queryResults').html(table += '</table>');
				$('#loading').remove();
			},
			fail: function(data) {
				alert(data);
				$('#loading').remove();
			}
		});
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template());
		console.log(this.$el);
		$('body').prepend(this.$el);
	}
});