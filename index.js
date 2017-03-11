var express = require('express')
var serveStatic = require('serve-static')
var morgan = require('morgan')

var app = express()

// for error handling
app.use(morgan('combined'))

// greeting page, might want to print a help message to use all command possible with the server.
app.get('/', function (req, res) {
  res.send('Bloub World!')
})

// to serve static files, we should protect every files except users.xml
app.use(serveStatic('.', {'index': ['default.html', 'default.htm']}))
app.listen(3000)

