var express = require('express')
var serveStatic = require('serve-static')
var morgan = require('morgan')
var convert = require('xml-js')
var fs = require('fs')

var app = express()

// for error handling
app.use(morgan('combined'))

// greeting page, might want to print a help message to use all command possible with the server.
app.get('/', function (req, res) {
  res.send('Bloub World!')
})

// to serve static files from public_data folder
app.use(serveStatic('public_data',  {'index': ['index.html', 'index.htm']}))

// parse xml file to be able to use it
var xml = fs.readFileSync('public_data/users.xml', 'utf8');
var options = {ignoreText: true, alwaysChildren: true};
var users = convert.xml2js(xml, options);

app.get('/users', function (req, res) {
  res.send(req.query)
  res.send(users)
})


app.listen(3000)

