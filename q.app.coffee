express     = require 'express'
fs          = require 'fs'
http        = require 'http'
lazy        = require 'lazy'
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

_fileName = './quotes.txt'

convertCsvFileToObject = (fileName, isLogged) ->
    console.log "convertCsvFileToObject called!!!"
    deferred = Q.defer()
    obj = []
    i = 0
    stream = fs.createReadStream(fileName)
    stream.on 'error', (err) ->
        console.log "[convertCsvFileToObject] Oh nooo! #{err}"
        deferred.reject new Error(err)
    new lazy(stream).lines.map(String).forEach (line) ->
            arr = line.trim().split ','
            symbol = arr[0].replace /\"/g, ''
            name = arr[1].replace /\"/g, ''
            # keeping values as a string to handle N/A case scenarios
            obj.push
                id: i++,
                symbol: symbol,
                name: name,
                ask: arr[2],
                bid: arr[3],
                last_trade: arr[4],
                previous_close: arr[5]
        .on 'pipe', ->
            if isLogged
                console.log "==> CSV file converted to object contains:"
                console.log obj
            deferred.resolve obj
        .on 'error', (err) ->
            console.log "[convertCsvFileToObject] Oh nooo! #{err}"
            deferred.reject new Error(err)
    deferred.promise

getQuotesFromServer = (fileName, stocks, options) ->
    deferred = Q.defer()
    _data = ""
    options or=
        hostname: 'download.finance.yahoo.com'
        path: "/d/quotes.csv?s=#{stocks}&f=snabl1p0"
    
    http.get options, (http_res) ->
        http_res.on 'data', (chunk) ->
            _data = chunk
        http_res.on 'end', (data) ->
            fs.writeFile fileName, _data, null, ->
                console.log "==> Wrote to file:\n#{_data}"
                deferred.resolve fileName
        .on 'error', (err) ->
            console.log "[getQuotesFromServer] Oh nooo! #{err}"
            deferred.reject new Error(err)
    deferred.promise

# usage: http://elie_labeca.micheltem.c9.io/quotes.json (returns default stocks: AAPL+MSFT+GOOG)
#        http://elie_labeca.micheltem.c9.io/quotes.json?stocks=AAPL+MSFT+GOOG+SBUX+ORCL+TWX
app.get "/quotes.json", (req, res) ->
    stocks = req.param "stocks", "AAPL+GOOG+MSFT"
    stocks = stocks.replace /\ /g, '+'
    Q.when(getQuotesFromServer _fileName, stocks)
    .then (filename) -> 
        convertCsvFileToObject filename, true
    .then (obj) ->
        res.send JSON.stringify(obj), 200
        
app.get "/", (req, res) -> res.render 'index'

port = process.env.PORT || 5000;
app.listen port, -> console.log "Listening on " + port

