/**
 * @constructor
 */
const promisify = require("../../lib/promises").promisify;

function MockCopernic() {}
module.exports = MockCopernic

MockCopernic.prototype._setupExpress = function(app) {
  let self = this
  app.post("/piq/RESTAdapter/api/sd/facture", function(req, res) {
    var payload = {}; // TODO: decode from POSTed JSON
    promisify(self.handleNewfact(req, payload)).then(function() {
      // TODO: observe actual success behavior from the real thing
      res.send('OK')
    }).catch(function() {
      // TODO: observe actual error behavior from the real thing
      res.send('NOT OK')
    })
  })
  app.get('/', function(req, res) {
    res.send('hello world');
  });
}

MockCopernic.prototype.run = require("../../lib/express-server-mixin.js").run

MockCopernic.prototype.reset = function() {
  // Reset methods to their prototype, in case a test overrode them
  delete this.handleNewFact
}

MockCopernic.prototype.handleNewFact = function() {}
