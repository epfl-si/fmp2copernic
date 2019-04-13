let 
  chai = require("chai"),
  assert = chai.assert,
  Copernic = require("./mock/copernic.js"),
  Fmp2CopernicGateway = require("../fmp2copernic.js"),
  rp = require('request-promise-native'),
  epflPeopleApi = require('./mock/epfl-people-api'),
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

function base64(string) {
  return Buffer.from(string).toString('base64')
}

describe("/copernic/newfact gateway", function() {
  let underTest, fakeCopernic;
  before(function() {
    fakeCopernic = new Copernic()
    return fakeCopernic.run().then(function() {
      underTest = new Fmp2CopernicGateway({
        port: 0, // Let the OS pick a port
        copernicHostPort: fakeCopernic.getHostPort(),
        attachmentDirectory: tmpdir,
        inject: { epflPeopleApi }
      })
      return underTest.run()
    })
  })

  beforeEach(function() {
    fakeCopernic.reset()
  })
  function uriTest(params) {
      let baseUrl = "http://localhost:" + ((params && params.fakeCopernic) ? params.fakeCopernic : underTest).listener.address().port
      return baseUrl + "/copernic/newfact?" + querystring.stringify(
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
    }, params))
  }

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
      assert.startsWith(r.body, "ERROR ")
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
      assert.startsWith(r.body, "ERROR ")
    })
  })

  it("rejects if have both fictr and clientnr", function() {
    return rp({
      uri: uriTest() + "&fictr=toto",
      resolveWithFullResponse: true,
      simple: false
    }).then(function(r) {
      assert.equal(r.statusCode, 500)
      assert.startsWith(r.body, "ERROR ")
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
      sciperInMock = parseInt(req.body.shipper.sciper);
      if (req && req.body && req.body.shipper && req.body.shipper.name) {
        nameInMock = req.body.shipper.name;
      }
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
      if (req && req.body && req.body.items &&
          req.body.items[0] && req.body.items[0].number) {
        numberInMock = req.body.items[0].number;
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
      if (req && req.body && req.body.items &&
          req.body.items[0] && req.body.items[0].qty) {
        qtyInMock = req.body.items[0].qty;
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
      if (req && req.body && req.body.items && req.body.items[0] &&
          req.body.items[0].price) {
        priceInMock = req.body.items[0].price;
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
      if (req && req.body && req.body.items && req.body.items[0] &&
          req.body.items[0].text) {
        textInMock = req.body.items[0].text;
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

  it("transmits multiple items", function() {
    let itemCount;
    fakeCopernic.handleNewfact = function(req) {
      itemCount = req.body.items.length;

      return "12345"
    }
    return rp({
        uri: uriTest() + "&qty1=1&text1=cauliflower&number1=units&price1=130&qty2=4&text2=broccoli&number2=liters&price2=120",
      })
      .then(responseBody => {
        assert.equal(itemCount, 3)
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

  it("transmits the filename", function() {
    let filenameInMock
    fakeCopernic.handleNewfact = function(req) {
      if (req && req.body && req.body.attachment && req.body.attachment[0] && req.body.attachment[0].filename) {
        filenameInMock = req.body.attachment[0].filename;
      }
      return "12345"
    }
    return fp(
      tmpdir + '/test1.pdf', "It doesn't really matter what is in the PDF"
    ).then(function() {
      return rp({
        uri: uriTest({
          PathDevisPDF: "P:/test1.pdf"
        })
      })
    }).then(function() {
      assert.equal(filenameInMock, "test1.pdf");
    })
  })

  it("transmits the filecontent", function() {
    let attachmentInMock = null;
    let fileContent = "lorem ipsum$";
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
      assert.equal(attachmentInMock[0].filecontent, base64(fileContent))
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
      assert.startsWith(r.body, "ERROR ")
    })
  })

  it("accepts and transmits PathAnythingBBQ", async function () {
    let pdfBytes = '%PDF /notreally'
    let gifBytes = 'GIF89a'
    let base64encoded = Buffer.from(pdfBytes).toString('base64')
    let test1Path = tmpdir + '/test1.pdf',
        test2Path = tmpdir + '/test2.pdf'  // Not .gif on purpose
    await fp(test1Path, pdfBytes)
    await fp(test2Path, gifBytes)

    let attachments
    fakeCopernic.handleNewfact = function(req) {
      attachments = req.body.attachment
      return "12345"
    }

    let r = await rp({
      uri: uriTest({
        PathChouFleurPDF: 'P:/test1.pdf',
        PathDessertGIF: 'P:/test2.pdf'
      }),
      resolveWithFullResponse: true,
      simple: false
    })
    assert.equal(r.statusCode, 200)

    attachments = attachments.sort((a, b) => a.filename < b.filename ? -1 : 1)
    assert.equal(attachments[0].filename, "test1.pdf")
    assert.equal(attachments[0].filetype, "application/pdf")
    assert.equal(attachments[0].filedescription, "ChouFleur")
    assert.equal(attachments[0].filedescription, "ChouFleur")
    assert.equal(attachments[0].filecontent, base64(pdfBytes))
    assert.equal(attachments[1].filename, "test2.pdf")
    assert.equal(attachments[1].filetype, "image/gif")
    assert.equal(attachments[1].filedescription, "Dessert")
    assert.equal(attachments[1].filecontent, base64(gifBytes))
  })

  it("can be configured to use another base URL", function() {
    fakeCopernic.serveAt('/somewhere/else');
    let wentThroughTheNewEndpoint;
    fakeCopernic.handleNewfact = function(req) {
      if (req.originalUrl.match(/somewhere\/else/)) {
        wentThroughTheNewEndpoint = true;
      } else {
        console.log("Still using the old endpoint");
      }
      return "12345"
    }
    let fmp2copernicJustForThisTest =
        new Fmp2CopernicGateway({
        port: 0, // Let the OS pick a port
        copernicHostPort: fakeCopernic.getHostPort(),
        copernicBaseURL : "/somewhere/else",
        attachmentDirectory: tmpdir,
        inject: { epflPeopleApi }
      })
    return fmp2copernicJustForThisTest.run().then(function() {
      return rp({uri: uriTest({fakeCopernic: fmp2copernicJustForThisTest})
      })
    }).then(function(responseBody) {
      assert(wentThroughTheNewEndpoint);
    }).finally(function() {
      return fmp2copernicJustForThisTest.shutdown()
    })
  })

  it("transmits COPERNIC errors", function() {
    fakeCopernic.handleNewfact = function(req) {
      throw new Copernic.ClientError("No deal");
    }
    return rp({
      uri: uriTest(),
      resolveWithFullResponse: true,
      simple: false
    }).then(function(r) {
      assert.equal(r.statusCode, 500)
      assert.startsWith(r.body, "ERROR No deal")
    })
  })

  after(function() {
    return underTest.shutdown().then(() => fakeCopernic.shutdown())
  })
})
