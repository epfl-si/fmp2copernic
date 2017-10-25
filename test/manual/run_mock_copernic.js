let MockCopernic = require("../mock/copernic.js"),
  mockCopernic = new MockCopernic()


mockCopernic.opts = {
  port: 3010
}

mockCopernic.run().then(function() {
  console.log("Mock Copernic running on port " + mockCopernic.getHostPort())
})
