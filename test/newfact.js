let assert=require("assert"),
    Copernic = require("./mock/copernic.js"),
  Fmp2CopernicGateway = require("../fmp2copernic.js")

describe("/copernic/newfact gateway", function() {
  let underTest, fakeCopernic;
  before(function() {
    fakeCopernic = new Copernic()
    return fakeCopernic.run().then(function() {
      underTest = new Fmp2CopernicGateway({
        port: 0, // Let the OS pick a port
        copernicHostPort: fakeCopernic.getHostPort
      })
      return underTest.run()
    }).then(function() {
      underTest.baseUrl = "http://localhost:" + underTest.listener.address().port
    })
  })

  beforeEach(function() {
    fakeCopernic.reset();
  })

  it("decodes and forwards a simple request", function() {
    let rp = require('request-promise-native');
    return rp(underTest.baseUrl + "/copernic/newfact?ordertype=INTERNE" +
        "&ordernr=OF-4-2017&currency=CHF&clientnr=243371&fictr=0380" +
        "&name=FAC-4-2017&sciper=106550&fund=520088&number=9010192" +
        "&qty=1&price=3140&text=Projet%20:%20test%20Copernic" +
        "&execmode=SIMU" +
        "&PathFacturePDF=P:%2FATPR%2FTravaux%2F2017%2FSTI-DO%2FQuatravaux%20Dominique%20Herv%C3%A9%20Claude%2F25.09.2017-OF-4%2FFAC_OF-4-2017.pdf" +
        "&PathDevisPDF=P:%2FATPR%2FTravaux%2F2017%2FSTI-DO%2FQuatravaux%20Dominique%20Herv%C3%A9%20Claude%2F25.09.2017-OF-4%2FDevis_OF-4-2017.pdf")
      .then(function(response) {
        assert(true)
      })
  })

    after(function() {
      return underTest.shutdown().then(() => fakeCopernic.shutdown())
    })
})
