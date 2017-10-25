const promisify = require("../../lib/promises").promisify,
  ourExpress = require("../../lib/our-express.js")

/**
 * @constructor
 */
function MockCopernic() {
  let self = ourExpress.new(MockCopernic)
  self.post("/piq/RESTAdapter/api/sd/facture", function(req, res) {
    let payload = {}; // TODO: decode from POSTed JSON
    promisify(self.handleNewfact(req, payload)).then(function() {
      // TODO: observe actual success behavior from the real thing
      res.send('OK')
    }).catch(function() {
      // TODO: observe actual error behavior from the real thing
      res.send('NOT OK')
    })
  })
  self.get('/', function(req, res) {
    res.send("HELLO WORLD");
  })
  return self
}

module.exports = MockCopernic

MockCopernic.prototype.reset = function() {
  // Reset methods to their prototype, in case a test overrode them
  this.handleNewFact = MockCopernic.prototype.handleNewFact
}

MockCopernic.prototype.handleNewFact = function() {}

MockCopernic.prototype.getHostPort = function() {
  return "localhost:" + this.listener.address().port
}
