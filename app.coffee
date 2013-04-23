express     = require 'express'
http        = require 'http'
Q           = require 'q'

app = express()

app.use express.logger()

app.configure ->
    app.set "views", __dirname + "/views"
    app.set "view engine", "jade"
    app.use express.bodyParser()
    app.use express.methodOverride()
    app.use app.router
    app.use express.static(__dirname + "/public")

app.configure "development", ->
    app.use express.errorHandler
        dumpExceptions: true
        showStack: true

app.configure "production", ->
    app.use express.errorHandler()
	
app.set('view options', {
    layout: false
});

getQuotesFromServer = (stocks, options) ->
	deferred = Q.defer()
	_data = ""
	obj = []
	i = 0
	options or= {}
	options.hostname or= 'download.finance.yahoo.com'
	options.path or= "/d/quotes.csv?s=#{stocks}&f=snabl1p0"
	console.log "==> Calling host #{options.hostname}#{options.path}"
	http.get options, (http_res) ->
		http_res.on 'data', (chunk) -> _data = chunk
		http_res.on 'end', (data) ->
			console.log "==> Received:\n#{_data}"
			_data.toString().split('\n').forEach (line) ->
				arr = line.toString().trim().split ','
				if arr[0]
					symbol = arr[0].replace /\"/g, ''
					name = arr[1].replace /\"/g, ''
					obj.push { id: i++, symbol: symbol, name: name, ask: arr[2], bid: arr[3], last_trade: arr[4], previous_close: arr[5] }
			deferred.resolve obj
		.on 'error', (err) ->
		    console.log "[getQuotesFromServer] Oh nooo! #{err}"
		    deferred.reject new Error(err)
	deferred.promise

# usage: http://elie_labeca.micheltem.c9.io/quotes.json (returns default stocks: AAPL+MSFT+GOOG)
#        http://elie_labeca.micheltem.c9.io/quotes.json?stocks=AAPL+MSFT+GOOG+SBUX+ORCL+TWX
app.get "/quotes.json", (req, res) ->
    stocks = req.param "stocks", "AAPL+GOOG+MSFT"
    stocks = stocks.replace /\ /g, '+'
    Q.when(getQuotesFromServer(stocks)).then (obj) -> res.send JSON.stringify(obj), 200
        
app.get "/", (req, res) -> res.render 'index'

port = process.env.PORT || 5000;
app.listen port, -> console.log "Listening on " + port

