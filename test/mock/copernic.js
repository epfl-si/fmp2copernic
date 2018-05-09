const promisify = require("../../lib/promises").promisify,
  fs = require("fs"),
  ourExpress = require("../../lib/our-express.js"),
  bodyParser = require('body-parser')
/**
 * @constructor
 */
function MockCopernic() {
  let self = ourExpress.new(MockCopernic)
  self.use(bodyParser.json());

  self.serveAt = function(baseURL) {
    self.post(baseURL + "/sd/facture", function(req, res, next) {
      promisify(() => self.handleNewfact(req)).then(function(docId) {
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify({
          "E_RESULT": {
            "item": {
              "DOC_NUMBER_TECH": 1,
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
        if (!self.maskingExceptions) {
          next(e)
        }
        // This is basically the same as
        // next(e);
        // except without the noise to standard output; plus tests get a chance
        // to look at the exception.
        self.caughtException = e;
        res.status(500);
        res.send(e + "");
      })
    })
  }

  self.serveAt('/piq/RESTAdapter/api')  // 'q' like 'qualification'

  self.get('/', function(req, res) {
    res.send("HELLO WORLD");
  })

  return self
}

module.exports = MockCopernic

MockCopernic.prototype.reset = function() {
  // Reset methods to their prototype, in case a test overrode them
  this.handleNewfact = MockCopernic.prototype.handleNewfact
  // .serveAt() cannot be undone, which is OK for a mock
  delete this.caughtException
  delete this.maskingExceptions
}

MockCopernic.prototype.handleNewfact = function() {
  return "12345"
}

MockCopernic.APIBaseURL = function() {
}

MockCopernic.prototype.getHostPort = function() {
  return "localhost:" + this.listener.address().port
}
