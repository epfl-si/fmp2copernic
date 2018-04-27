let assert = require("assert"),
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

describe("/copernic/newfact gateway", function() {
  let underTest, fakeCopernic;
  before(function() {
    fakeCopernic = new Copernic()
    return fakeCopernic.run().then(function() {
      underTest = new Fmp2CopernicGateway({
        port: 0, // Let the OS pick a port
        copernicHostPort: fakeCopernic.getHostPort(),
        attachmentDirectory: tmpdir
      })
      return underTest.run()
    }).then(function() {
      underTest.baseUrl = "http://localhost:" + underTest.listener.address().port
    })
  })

  beforeEach(function() {
    fakeCopernic.reset();
  })
  let uriTest = (params) => underTest.baseUrl + "/copernic/newfact?" + querystring.stringify(
    _.extend({
      ordertype: 'EXTERNE',
      ordernr: 'OF-4-2017',
      currency: 'CHF',
      clientnr: '243371',
      name: 'FAC-4-2017',
      sciper: '271774',
      fund: '520088',
      number: '9010192',
      qty: '1',
      price: '3140',
      text: 'Projet : test Copernic',
      execmode: 'SIMU',
      // PathFacturePDF: 'P:/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/FAC_OF-4-2017.pdf',
      // PathDevisPDF: '/var/filemaker/documents/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf'
    }, params))


  it("decodes and forwards a simple request", function() {
    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(responseBody, "OK 12345") // XXX It is actually not clear that FileMaker would be happy with this. Need to confirm with Claude
      })
  })


  it("transmits the sciper", function() {
    var sciperInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.shipper && req.body.shipper.sciper) {
        sciperInMock = req.body.shipper.sciper;
      }
      return "12345"
    }

    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(sciperInMock, 271774)
      })
  })

  it("converts the order type", function() {
    let ordertypeInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.header && req.body.header.ordertype) {
        ordertypeInMock = req.body.header.ordertype;
      }
      return "56789"
    }

    return rp({
      uri: uriTest({
        ordertype: "INTERNE"
      })
    }).then(responseBody => {
      assert.equal(ordertypeInMock, "ZINT")
    })
  })

  it("converts the order type", function() {
    let ordertypeInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.header && req.body.header.ordertype) {
        ordertypeInMock = req.body.header.ordertype;
      }
      return "56789"
    }

    return rp({
      uri: uriTest({
        ordertype: "EXTERNE"
      })
    }).then(responseBody => {
      assert.equal(ordertypeInMock, "ZEXT")
    })
  })

  it("rejects invalid order type", function() {
    return rp({
      uri: uriTest({
        ordertype: "JESUISFAUX"
      }),
      resolveWithFullResponse: true,
      simple: false
    }).then(function(r) {
      assert.equal(r.statusCode, 500)
    })
  })

  it("transmits the ordernr", function() {
    let ordernrInMock = "";
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.header && req.body.header.ordernr) {
        ordernrInMock = req.body.header.ordernr;
      }
      return "12345"
    }
    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(ordernrInMock, "OF-4-2017")
      })
  })

  it("rejects if have no fictr or clientnr", function() {
    return rp({
      uri: uriTest({
        clientnr: "c",
        fictr: "f"
      }),
      resolveWithFullResponse: true,
      simple: false
    }).then(function(r) {
      assert.equal(r.statusCode, 500)
    })
  })

  it("rejects if have both fictr and clientnr", function() {
    return rp({
      uri: uriTest() + "&fictr=toto",
      resolveWithFullResponse: true,
      simple: false
    }).then(function(r) {
      assert.equal(r.statusCode, 500)
    })
  })

  it("transmits the currency", function() {
    let currencyInMock = "";
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.header && req.body.header.currency) {
        currencyInMock = req.body.header.currency;
      }
      return "12345"
    }
    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(currencyInMock, "CHF")
      })
  })

  it("looks up the name in the API", function() {
    let nameInMock = null,
      sciperInMock = 0,
      infoPers = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.shipper && req.body.shipper.name) {
        nameInMock = req.body.shipper.name;
      }
      if (req && req.body && req.body.shipper && req.body.shipper.sciper) {
        sciperInMock = req.body.shipper.sciper;
      }
      sciperInMock = parseInt(req.body.shipper.sciper);
    }
    return rp({
        uri: uriTest(),
      }).then(function() {

        return epflPeopleApi.findBySciper(sciperInMock, 'en')
      })
      .then(function(person) {

        infoPers = person.firstname + " " + person.name;
      })
      .then(() => {

        assert.equal(nameInMock, infoPers)
      })
  })

  it("transmits the client number", function() {
    var clientnrInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.header && req.body.header.clientnr) {
        clientnrInMock = req.body.header.clientnr;
      }
      return "12345"
    }

    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(clientnrInMock, 243371)
      })
  })

  it("transmits the fund number", function() {
    var fundInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.shipper && req.body.shipper.fund) {
        fundInMock = req.body.shipper.fund;
      }
      return "12345"
    }

    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(fundInMock, 520088)
      })
  })

  it("transmits the items count", function() {
    var numberInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.items && req.body.items.number) {
        numberInMock = req.body.items.number;
      }
      return "12345"
    }

    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(numberInMock, 9010192)
      })
  })

  it("transmits the qty", function() {
    var qtyInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.items && req.body.items.qty) {
        qtyInMock = req.body.items.qty;
      }
      return "12345"
    }

    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(qtyInMock, 1)
      })
  })

  it("transmits the price", function() {
    var priceInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.items && req.body.items.price) {
        priceInMock = req.body.items.price;
      }
      return "12345"
    }

    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(priceInMock, 3140)
      })
  })

  it("transmits the text", function() {
    var textInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.items && req.body.items.text) {
        textInMock = req.body.items.text;
      }
      return "12345"
    }

    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(textInMock, "Projet : test Copernic")
      })
  })

  it("transmits the execmode", function() {
    var execmodeInMock = null;
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.execmode) {
        execmodeInMock = req.body.execmode;
      }
      return "12345"
    }

    return rp({
        uri: uriTest(),
      })
      .then(responseBody => {
        assert.equal(execmodeInMock, "SIMU")
      })
  })

  it("transmits the filecontent", function() {
    let attachmentInMock = null;
    let fileContent = "lorem ipsum$";
    let base64encoded = Buffer.from(fileContent).toString('base64');
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.attachment) {
        attachmentInMock = req.body.attachment;
      }
      return "12345"
    }
    return fp(
      tmpdir + '/test1.pdf', fileContent
    ).then(function() {

      return rp({
        uri: uriTest({
          PathDevisPDF: "P:/test1.pdf"
        }),
      })
    }).then(responseBody => {
      debug(attachmentInMock);
      assert.equal(attachmentInMock[0].filecontent, base64encoded)
    })
  })

  it("fails when the PathDevisPDF doesn't exist", function() {
    return rp({
      uri: uriTest({
        PathDevisPDF: "P:/ThisFileDoesNotExist.pdf"
      }),
      resolveWithFullResponse: true,
      simple: false
    }).then(function(r) {
      assert.equal(r.statusCode, 500)
    })
  })

  after(function() {
    return underTest.shutdown().then(() => fakeCopernic.shutdown())
  })
})
