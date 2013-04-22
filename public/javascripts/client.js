$(document).ready(function() {
	//     var test = [
	// {"id":0,"symbol":"AAPL","name":"Apple Inc.","ask":"429.70","bid":"428.88","last_trade":"429.80","previous_close":"434.33"},
	// {"id":1,"symbol":"MSFT","name":"Microsoft Corpora","ask":"30.00","bid":"N/A","last_trade":"28.79","previous_close":"28.935"},
	// {"id":2,"symbol":"GOOG","name":"Google Inc.","ask":"792.19","bid":"N/A","last_trade":"790.05","previous_close":"790.39"},
	// {"id":3,"symbol":"SBUX","name":"Starbucks Corpora","ask":"59.18","bid":"59.10","last_trade":"59.09","previous_close":"58.575"},
	// {"id":5,"symbol":"ORCL","name":"Oracle Corporatio","ask":"35.00","bid":"N/A","last_trade":"33.46","previous_close":"33.615"},
	// {"id":6,"symbol":"TWX","name":"Time Warner Inc. ","ask":"N/A","bid":"N/A","last_trade":"59.46","previous_close":"59.66"}
	// ];
    var defaultUrl = "/quotes.json?stocks=AAPL+MSFT+GOOG";
    
    var Stock = Backbone.Model.extend({
        defaults: { selected: "","id":0,"symbol":"\"SYMBOL\"","name":"None","ask":"N/A","bid":"N/A","last_trade":"N/A","previous_close":"N/A"},
    	toggleSelect: function() {
    		if (this.get('selected') === 'checked') {
    			this.set({ selected: '' });
    		} else {
    			this.set({ selected: 'checked' });
    		}
    	}
    });
    
    var StockList = Backbone.Collection.extend({
    	model: Stock,
    	url: defaultUrl
    });
    
    var StockView = Backbone.View.extend({
    	tagName: 'tr',
    	template: _.template($("#quote").html()),
    	initialize: function() {
    		this.model.on('remove', this.remove, this);
    	},
    	events: {
    		"change input.select": "toggleSelect",
			"click a.remove": "removeStock"
    	},
    	render: function() {
    		this.$el.append(this.template(this.model.toJSON()));
    		return this;
    	},
    	remove: function() {
    		this.$el.remove();
    	},
    	toggleSelect: function() {
    		this.model.toggleSelect();
    	},
    	removeStock: function() {
			this.$el.remove();
    		this.model.destroy();
    	}
    });
    
    var StockCarouselView = Backbone.View.extend({
    	className: 'item',
    	template: _.template($("#quote-carousel-item").html()),
    	initialize: function() {
    		this.model.on('remove', this.remove, this);
    	},
    	render: function() {
    		this.$el.append(this.template(this.model.toJSON()));
    		return this;
    	},
    	remove: function() {
    		this.$el.remove();
    	}
    });
    
    var StockListView = Backbone.View.extend({
    	el: $('#container'),
    	initialize: function() {
    		this.template = _.template($("#quote-list").html());
    		this.collection.on('add', this.addStock, this);
    		this.collection.on('reset', this.resetStocks, this);
    		this.collection.on('remove', this.removeStock, this);
    	},
    	events: {
    		"click #btn-refresh": "refresh",
    		"click #btn-delete": "deleteSelected",
    		"click #btn-add": "add"
    	},
    	render: function() {
    		this.$el.html(this.template());
    		this.resetStocks();
    		return this;
    	},
    	resetStocks: function() {
    		this.$el.find('#quotes tr').remove();
    		this.$el.find('#quote-carousel-inner .item').remove();
    		this.collection.forEach(this.addStock, this);
    	},
    	addStock: function(stock) {
    		var stockView = new StockView({model: stock});
    		var stockCarouselView = new StockCarouselView({model: stock});
    		this.$el.find('#quotes').append(stockView.render().el);
    		this.$el.find('#quote-carousel-inner').append(stockCarouselView.render().el);
    	},
    	removeStock: function(stock) {
    		this.collection.remove(stock);
            this.refresh(); // TODO: this shouldn't be required - to fix
    	},
    	refresh: function(e) {
    		var newUrl = "/quotes.json?stocks=" + this.collection.pluck('symbol').join('+');
            this.collection.fetch({ url: newUrl }).complete(function() {
                //console.log(this.collection.toJSON());
                $('#quote-carousel .carousel-inner .item:first').addClass('active');
            });
    	},
    	deleteSelected: function(e) {
    		this.collection.filter(function(stock) { return stock.get('selected') === 'checked' }).forEach(this.removeStock, this);
    	},
    	add: function(e) {
    		e.preventDefault();
    		var input = this.$el.find('#input-symbol');
    		var symbol = input.val();
    		input.val('');
    		this.collection.add(new Stock({ symbol: symbol }));
    		this.refresh();
    	}
    });
    
    var stockList = new StockList();
    var stockListView = new StockListView({ collection: stockList });
    stockListView.render();
    stockList.fetch({ url: defaultUrl }).complete(function() {
        $('#quote-carousel .carousel-inner .item:first').addClass('active');
    });
    $('#quote-carousel .carousel-inner .item:first').addClass('active');
    
    var refreshEvent = function() {
    	var oldIndex = $('#quote-carousel .carousel-inner .active').index();
    	stockListView.refresh();
    	$('#quote-carousel .carousel-inner .item').nextAll().eq(oldIndex - 1).addClass('active');
    	$('#quote-carousel').carousel(oldIndex);
    };
    
    window.setInterval(refreshEvent, 300000);

    $('#quote-carousel .carousel-inner .item:first').addClass('active');
    $('.carousel').carousel();
});