var express = require('express')
var serveStatic = require('serve-static')
var morgan = require('morgan')

var app = express()
app.use(morgan('combined'))

app.get('/', function(req, res) { 
  res.send('Bloub World!')
})

app.use(serveStatic('.', {
  'index': ['default.html', 'default.htm']
}))
app.listen(3000)