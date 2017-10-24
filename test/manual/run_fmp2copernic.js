/**
 * Run a mock Copernic, and a real Fmp2CopernicGateway in front of it
 */

let MockCopernic = require("../mock/copernic.js"),
  mockCopernic = new MockCopernic(),
  Fmp2CopernicGateway = require("../../fmp2copernic.js"),
  fmp2CopernicGateway

mockCopernic.run().then(function() {
  console.log("Mock Copernic running on " + mockCopernic.getHostPort())
  fmp2CopernicGateway = new Fmp2CopernicGateway({
      port: 3000,
      copernicHostPort: mockCopernic.getHostPort()
  })
  return fmp2CopernicGateway.run()
}).then(function() {
  console.log("Fmp2Copernic running on port " +
              fmp2CopernicGateway.listener.address().port)
})
