var BindingView = Backbone.View.extend({
	template: _.template(' \
		<div id="bindingContainer" class="bindingContainer">\
			<div class="bindingHeader"><span style="float: left; margin-right: 20px;">Bindings</span><span style="margin-left: 20px;" id="remove">remove</span></div> \
			<div class=bindingElementsContainer"> \
				<% _.each(bindList, function(i) { %> <div class="bindingColumn">from <%= $(i.from).text() %> to <%= $(i.to).text() %> </div> <% }); %> \
			</div> \
		</div> \
	'),
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template({ bindList: bindList }));
		this.$el.css('width', '300px');
		$('#workspace').append(this.$el);
		console.log(this.$el);
	}
});

var BindingClearButtonView = Backbone.View.extend({
	tagName: 'span',
	template: _.template(' \
		<div class="toolButton">\
			Clear Bindings \
		</div> \
	'),
	events: {
		'click .toolButton' : function() {
			bindList = [];
			jsPlumb.detachEveryConnection();
			bindingView.render();
		},
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template);
	}
});
