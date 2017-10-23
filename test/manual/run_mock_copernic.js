let MockCopernic = require("../mock/copernic.js"),
  mockCopernic = new MockCopernic()

mockCopernic.run({
  opts: {
    port: 3000
  }
}).then(function(express) {
  console.log("Mock Copernic running on port " + express.address().port)
})
