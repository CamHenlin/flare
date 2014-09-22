
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
		'click #runQuery' : 'runQuery'
	},
	runQuery: function() {
		$('body').append('<div id="loading" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px; z-index: 1000; background: #fff; opacity: 0.5; text-align: center;"><img style="top: 600px; opacity: 1; width: 60%; image-rendering: -webkit-optimize-contrast;" src="loading.gif" /></div>');
		var postData = { 'bindings' : [] };
		var i = 0;
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
				} else if ($(el).attr('class').indexOf('sentiment') > -1) {
					type = 'sentiment';
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
			url: 'http://67.189.44.237:7000/query',
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			data: JSON.stringify(postData, null, '\t'),
			success: function(data) {
				//tdata = JSON.parse(tdata);
				console.log(data);
				// $('#queryResults').append(JSON.stringify(data.results));

				$('#resultCount').text(data.results.length + ' results');
				$('#queryResults').html('<table id="outtable"><tr><th>query result</th><th>score</th></table>');
				data.results.forEach(function(result) {
					$('#outtable').append('<tr><td class="queryResult">' + JSON.stringify(result) + '</td></tr>');
				});

				$('#loading').remove();

				/*$.ajax({
					url: 'http://67.189.44.237:7000/gensimquery',
					type: 'POST',
					contentType: 'application/json;charset=UTF-8',
					data: JSON.stringify(postData, null, '\t'),
					success: function(gensimdata) {
						console.log(gensimdata);
						console.log('gensimdata received');
						for (var i = 0; i < gensimdata.results.length; i++) {
							var gensimres = gensimdata.results[i];
							console.log('------');
							console.log($('.queryResult')[i]);
							console.log(gensimres);
							$($('.queryResult')[i]).after('<td>' + gensimres[gensimres.length - 1][1] + '</td>');
							console.log('------');
						}
					}
				});*/
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