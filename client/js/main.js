

function findTableTitle(el) {
	if (typeof($(el).attr('data-binding-table-title')) !== "undefined") {
		return $(el).attr('data-binding-table-title');
	}

	return findTableTitle($(el).parent());
}

/*
	clickhandling methods
 */

var isAwaitingClick = false;
var clickedElement = null;
var clickHandler = function(evt) {
	if (clickedElement === null) { return; }

	var element = document.elementFromPoint(evt.clientX, evt.clientY);
	if (element === clickedElement) { return; }

	console.log(evt);
	console.log(element);

	bindList.push(Binding(clickedElement, element));
	jsPlumb.connect({ source: clickedElement, target: element });
	clickedElement = null;
	bindingView.render();
	$('body').unbind('click', clickHandler);
};

/*
	bindings + globals
 */

var bindList = [];
function Binding(from, to) {
	return {
		"from" : $(from),
		"to" :  $(to)
	};
}
var bindingView = new BindingView({});

var resultData = [];
var tables = [];

/*
var filterView = new FilterView({model : new FilterModel()});

var similarityView = new SimilarityView({model : new SimilarityModel()});

var sentimentView = new SentimentView({model : new SentimentModel()});*/

(function() {
	var queryView = new QueryView({});

	var tableCollection = new TableCollection();


	jsPlumb.setContainer($('body'));
	$.ajax({
		url: baseurl + 'tables',
		type: 'GET',
		success: function(data) {
			console.log(data.tables);
			data.tables.forEach(function(table) {
				$.ajax({
					url: baseurl + 'columns/' + table,
					type: 'GET',
					success: function(tdata) {
						//tdata = JSON.parse(tdata);
						console.log(tableCollection);
						tables.push({ tableTitle: table, tableColumns: tdata.columns });
						tableCollection.add(new TableModel({ tableTitle: table, tableColumns: tdata.columns }));
						setTimeout(function() {
							$('#loading').remove();
						}, 500);

					}
				});
			}.bind(tableCollection));

			setTimeout(function() {
				new TablesView({ collection: tableCollection });
			}, 500);
		}
	});
})();

$(document).click(function() {
	jsPlumb.repaintEverything();
});