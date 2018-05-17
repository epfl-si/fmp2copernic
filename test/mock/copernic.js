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
        if (e instanceof MockCopernic.ClientError) {
          res.set('Content-Type', 'application/json');
          res.send(JSON.stringify({
            "E_RESULT": {
              "item": {
                "DOC_NUMBER": "",
                "IS_ERROR": "X",
                "LOG": {
                  "item": {
                    "TYPE": "E",
                    "MESSAGE": e.message
                  }
                }
              }
            }
          }
          ));
        } else {
          next(e)
        }
      })
    })
    self.get(baseURL + "/sd/facture/:factureNo", function(req, res, next) {
      promisify(() => self.handleGetfact(req.params.factureNo)).then(function(payload) {
        res.set('Content-Type', 'application/json')
        res.send(JSON.stringify(payload))
      }).catch(function(e) { next(e) })
    })
  }

  self.serveAt('/piq/RESTAdapter/api')  // 'q' like 'qualification'

  self.get('/', function(req, res) {
    res.send("HELLO WORLD");
  })

  return self
}

module.exports = MockCopernic

/**
 * @constructor
 */
MockCopernic.ClientError = class extends Error {}

MockCopernic.prototype.reset = function() {
  // Reset methods to their prototype, in case a test overrode them
  this.handleNewfact = MockCopernic.prototype.handleNewfact
  this.handleGetfact = MockCopernic.prototype.handleGetfact
  // .serveAt() cannot be undone, which is OK for a mock
  delete this.caughtException
  delete this.maskingExceptions
}

MockCopernic.prototype.handleNewfact = function() {
  return "12345"
}

MockCopernic.prototype.handleGetfact = function() {
  return {
        header: {
          ordertype: "ZINT",
          ordernr: "OF-127-2018",
          billnr: 860014806,
          total: "1.00",
          currency: "CHF",
          clientnr: 219591,
          description: "",
          creation_date: "2018-05-17",
          distribution: ""
        },
        shipper: {
          name: "Alfred Thomas",
          sciper: 106550,
          fund: 520088,
          email: "+41 21 6937334",
          tel: "alfred.thomas@epfl.ch"
        },
        items: {
          number: 9010192,
          qty: "1.000",
          unit: "H",
          price: "1.00",
          text: "Projet : TEST FMP2COPERNIC Selon la demande de tra",
          shipper_imputation: ""
        },
        status: "Pré-saisie",
        status_code: "PRES"
      };
}

MockCopernic.APIBaseURL = function() {
}

MockCopernic.prototype.getHostPort = function() {
  return "localhost:" + this.listener.address().port
}
