let 
  chai = require("chai"),
  assert = chai.assert,
  Copernic = require("./mock/copernic.js"),
  Fmp2CopernicGateway = require("../fmp2copernic.js"),
  rp = require('request-promise-native'),
  epflPeopleApi = require('epfl-people-api'),
  os = require('os'),
  tmpdir = os.tmpdir(),
  util = require("util"),
  fs = require('fs'),
  fp = util.promisify(fs.writeFile),
  _ = require("lodash"),
  querystring = require('querystring'),
  debug = require('debug')('newfact');

chai.use(require('chai-string'))  // For assert.startsWith

if (! Promise.prototype.finally) {
  Promise.prototype.finally = function (what) {
    this.then(what, what)
  }
}

describe("/copernic/facture", function() {
  before(function() {
    fakeCopernic = new Copernic()
    return fakeCopernic.run().then(function() {
      underTest = new Fmp2CopernicGateway({
        port: 0, // Let the OS pick a port
        copernicHostPort: fakeCopernic.getHostPort(),
        attachmentDirectory: tmpdir
      })
      return underTest.run()
    })
  })

  function uriTest(factureNo, params) {
      let baseUrl = "http://localhost:" + ((params && params.fakeCopernic) ? params.fakeCopernic : underTest).listener.address().port
      return baseUrl + "/copernic/facture/" + factureNo;
  }

  beforeEach(function() {
    fakeCopernic.reset()
  })

  after(function() {
    return underTest.shutdown().then(() => fakeCopernic.shutdown())
  })

  it("sends a /statutTexte", function() {
    fakeCopernic.handleGetfact = function(factNum) {
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

    return rp(uriTest(860012345) + "/statutTexte").then(function(statusText) {
      assert.equal("Pré-saisie", statusText);
    })
  })
})
