
var SimilarityModel = Backbone.Model.extend({
	defaults: {
		column: 'column'
	}
});

var SimilarityView = Backbone.View.extend({
	tagName: 'span',
	model: FilterModel,
	template: _.template(' \
		<div class="similarityContainer">\
			<div class="similarityHeader"><span style="float: left; margin-right: 20px;">Similarity - <%= column %></span><span style="margin-left: 20px;" id="remove">remove</span></div> \
			<div class=similarityFormContainer"> \
				<label>&nbsp; similar to: </label><input type="text" id="similarityString"> \
			</div> \
		</div> \
	'),
	events: {
		'click #remove' : 'remove',
		'click .tableColumn' : 'bindColumn'
	},
	remove: function() {

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