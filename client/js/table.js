
var TableModel = Backbone.Model.extend({
	defaults: {
		tableTitle: 'table title',
		tableColumns: ['one', 'two', 'three']
	}
});

var TableCollection = Backbone.Collection.extend({
	model: TableModel
});

var TableView = Backbone.View.extend({
	model: TableModel,
	template: _.template(' \
		<div class="tableContainer" data-binding-table-title="<%= tableTitle %>"> \
			<div class="tableHeader"><span style="float: left; margin-right: 20px;"><%= tableTitle %></span> <span style="margin-left: 20px;" id="remove">remove</span></div> \
			<div class="tableColumnContainer"> \
				<% _.each(tableColumns, function(i) { %> <div class="tableColumn" data-binding-col-title="<%= i %>"><%= i %></div> <% }); %> \
			</div> \
		</div> \
	'),
	events: {
		'click #remove' : 'remove',
		'click .tableColumn' : 'bindColumn'
	},
	duplicate: function() {
		console.log('duplicating');
		tableCollection.add(_(this.model).clone());
	},
	remove: function() {

	},
	bindColumn: function(e) {
		console.log(e);
		clickedElement = e.target;
		setTimeout(function() {
			$('body').bind('click', clickHandler);
		}, 60);
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		console.log(this.model);
		this.$el.html(this.template(this.model.toJSON()));
		console.log(this.$el);
		this.$el.draggable();

		jsPlumb.draggable(this.$el);
	}
});

var SecondaryTableView = Backbone.View.extend({
	template: _.template(' \
		<div class="sideTable"><%= tableTitle %></div> \
	'),
	events: {
		'click .sideTable' : 'duplicate'
	},
	duplicate: function() {
		console.log('duplicating');
		tableCollection.add(_(this.model).clone());
	},
	remove: function() {

	},
	bindColumn: function(e) {
		console.log(e);
		clickedElement = e.target;
		setTimeout(function() {
			$('body').bind('click', clickHandler);
		}, 60);
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		console.log(this.model);
		this.$el.html(this.template(this.model.toJSON()));
		console.log(this.$el);
		this.$el.draggable();

		jsPlumb.draggable(this.$el);
	}
});

var TablesView = Backbone.View.extend({
	el: '#workspace',
	initialize: function() {
		console.log(this.collection);
		this.collection.bind('add', this.render.bind(this)); // test: tableCollection.add(new TableModel({ tableTitle: 'test', tableColumns: ['1', '2'] }));
		this.render();
	},
	render: function() {
		$('#sidebar').empty();
		$('#sidebar').prepend('<h3>tables</h3>');
		console.log(this.collection);
		this.collection.forEach(function(table) {
			var tableView = new TableView({ model: table });
			console.log(this.el);
			$('#workspace').append(tableView.el);

			var secondaryTableView = new SecondaryTableView({ model: table });
			console.log(this.el);
			$('#sidebar').append(secondaryTableView.el);
		});
		$('#sidebar').append('<h3>tools</h3>');
		$('#sidebar').append((new FilterButtonView({})).el);
		$('#sidebar').append((new SentimentButtonView({})).el);
		$('#sidebar').append((new SimilarityButtonView({})).el);
		$('#sidebar').append((new BindingClearButtonView({})).el);
	}
});