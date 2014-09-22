
var SentimentModel = Backbone.Model.extend({
	defaults: {
		column: 'column'
	}
});


var SentimentButtonView = Backbone.View.extend({
	model: FilterModel,
	template: _.template(' \
		<div class="toolButton">\
			Sentiment \
		</div> \
	'),
	events: {
		'click .toolButton' : function() {
			new SentimentView({model : new SentimentModel()});
		},
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template);
	}
});

var SentimentView = Backbone.View.extend({
	tagName: 'span',
	model: FilterModel,
	template: _.template(' \
		<div class="sentimentContainer">\
			<div class="sentimentHeader"><span style="float: left; margin-right: 20px;">Sentiment - <%= column %></span><span style="margin-left: 20px;" id="remove">remove</span></div> \
			<div class=sentimentFormContainer"> \
				<label>&nbsp; Analyze sentiment on this column</label> \
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
		this.$el.css('width', '360px');
		$('#workspace').append(this.$el);
		this.$el.draggable();
		jsPlumb.draggable(this.$el);
	}
});