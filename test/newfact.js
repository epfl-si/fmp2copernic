let assert = require("assert"),
  Copernic = require("./mock/copernic.js"),
  Fmp2CopernicGateway = require("../fmp2copernic.js"),
  rp = require('request-promise-native')

describe("/copernic/newfact gateway", function() {
  let underTest, fakeCopernic;
  before(function() {
    fakeCopernic = new Copernic()
    return fakeCopernic.run().then(function() {
      underTest = new Fmp2CopernicGateway({
        port: 0, // Let the OS pick a port
        copernicHostPort: fakeCopernic.getHostPort()
      })
      return underTest.run()
    }).then(function() {
      underTest.baseUrl = "http://localhost:" + underTest.listener.address().port
    })
  })

  beforeEach(function() {
    fakeCopernic.reset();
  })
  let uriTest = () => underTest.baseUrl + "/copernic/newfact?ordertype=INTERNE" +
    "&ordernr=OF-4-2017&currency=CHF&clientnr=243371&fictr=0380" +
    "&name=FAC-4-2017&sciper=106550&fund=520088&number=9010192" +
    "&qty=1&price=3140&text=Projet%20:%20test%20Copernic" +
    "&execmode=SIMU" +
    "&PathFacturePDF=P:%2FATPR%2FTravaux%2F2017%2FSTI-DO%2FQuatravaux%20Dominique%20Herv%C3%A9%20Claude%2F25.09.2017-OF-4%2FFAC_OF-4-2017.pdf" +
    "&PathDevisPDF=P:%2FATPR%2FTrav4ux%2F2017%2FSTI-DO%2FQuatravaux%20Dominique%20Herv%C3%A9%20Claude%2F25.09.2017-OF-4%2FDevis_OF-4-2017.pdf"


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
        assert.equal(sciperInMock, 106550)
      })
  })


  after(function() {
    return underTest.shutdown().then(() => fakeCopernic.shutdown())
  })
})