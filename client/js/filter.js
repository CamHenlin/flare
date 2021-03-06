
var FilterModel = Backbone.Model.extend({
	defaults: {
		column: 'column'
	}
});

var FilterButtonView = Backbone.View.extend({
	tagName: 'span',
	model: FilterModel,
	template: _.template(' \
		<div class="toolButton">\
			Filter \
		</div> \
	'),
	events: {
		'click .toolButton' : function() {
			new FilterView({model : new FilterModel()});
		},
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template);
	}
});

var FilterView = Backbone.View.extend({
 	model: FilterModel,
	template: _.template(' \
		<div class="filterContainer">\
			<div class="filterHeader"><span style="float: left; margin-right: 20px;">Filter - <%= column %></span><span style="margin-left: 20px;" id="remove">remove</span></div> \
			<div class=filterFormContainer"> \
				<label>&nbsp; contains </label><input type="checkbox" id="contains" checked><br> \
				<label>&nbsp; equal to </label><input type="checkbox" id="exactlyEqualTo"><br> \
				<label>&nbsp; in range </label><input type="checkbox" id="inRange"><br> \
				<label>&nbsp; less than </label><input type="checkbox" id="lessThan"><br> \
				<label>&nbsp; greater than </label><input type="checkbox" id="greaterThan"><br> \
				<label>&nbsp; </label><input type="text" id="filterBy"> \
			</div> \
		</div> \
	'),
	events: {
		'click #remove' : 'remove',
		'click .tableColumn' : 'bindColumn'
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		this.$el.css('width', '300px');
		$('#workspace').append(this.$el);
		console.log(this.$el);
		this.$el.draggable();
		jsPlumb.draggable(this.$el);
	}
});