let MockCopernic = require("../mock/copernic.js"),
  mockCopernic = new MockCopernic(),
  Fmp2CopernicGateway = require("../../fmp2copernic.js"),
  fmp2CopernicGateway

mockCopernic.run().then(function(express) {
  let mockCopernicHostPort = "localhost:" + mockCopernic.listener.address().port
  console.log("Mock Copernic running on " + mockCopernicHostPort)
  fmp2CopernicGateway = new Fmp2CopernicGateway({
      port: 3000, // Let the OS pick a port
      copernicHostPort: mockCopernicHostPort
  })
  return fmp2CopernicGateway.run()
}).then(function() {
  console.log("Fmp2Copernic running on port " +
              fmp2CopernicGateway.listener.address().port)
})
