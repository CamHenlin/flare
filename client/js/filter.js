
var FilterModel = Backbone.Model.extend({
	defaults: {
		column: 'column'
	}
});

var FilterView = Backbone.View.extend({
	tagName: 'span',
	model: FilterModel,
	template: _.template(' \
		<div class="filterContainer">\
			<div class="filterHeader"><span style="float: left; margin-right: 20px;">Filter - <%= column %></span><br></div> \
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