const promisify = require("../../lib/promises").promisify,
  fs = require("fs"),
  ourExpress = require("../../lib/our-express.js")

/**
 * @constructor
 */
function MockCopernic() {
  let self = ourExpress.new(MockCopernic)
  self.post("/piq/RESTAdapter/api/sd/facture", function(req, res, next) {
    let payload = {}; // TODO: decode from POSTed JSON
    promisify(() => self.handleNewfact(req, payload)).then(function(docId) {

      res.send(JSON.stringify({
        "E_RESULT": {
          "item": {
            "DOC_NUMBER_TECH": 1,
            // TODO: DOC_NUMBER = whatever the function handleNewfact returns
            "DOC_NUMBER": docId,
            "REC_DATE": "2016-02-10",
            "PAYMENT_DUE_DATE": "2016-02-10",
            "PURCH_NO": "ASF1234567",
            "TRANSMITTER": "Pommes Suisses",
            "RECEIVER": "Affaires culturelles et artistiques",
            "AMOUNT_CHF": "250.00",
            "NET_VAL_HD": "250.00",
            "CURREN_ISO": "CHF",
            "ALV_SELECTED": "",
            "ALV_ROW_DESIGN": "00",
            "ALV_ERROR_VARIANT": "",
            "IS_ERROR": "",
            "ATTACHMENTS_PATH": "",
            "LOG": "",
            "ALV_ORDER_CREATED": "X",
            "ALV_HAS_ATTACHMENTS": "",
            "ALV_TABLE_POPIN": ""
          }
        }
      }))
    }).catch(function(e) {
      next(e)
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
  this.handleNewfact = MockCopernic.prototype.handleNewfact
}

MockCopernic.prototype.handleNewfact = function() {
  return "12345"
}

MockCopernic.prototype.getHostPort = function() {
  return "localhost:" + this.listener.address().port
}
