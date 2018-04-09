/**
 * Run a real Fmp2CopernicGateway
 */


let Fmp2CopernicGateway = require("../../fmp2copernic.js"),
  fmp2CopernicGateway,
  fs = require('fs');

let config = JSON.parse(fs.readFileSync('config.json')),
  secrets = JSON.parse(fs.readFileSync('secrets.json'));

fmp2CopernicGateway = new Fmp2CopernicGateway({
  port: config.port || 3000,
  copernicHostPort: "sapservices.epfl.ch",
  protocol: config.protocol || "http",
  attachmentDirectory: config.attachmentDirectory,
  user: secrets.user,
  password: secrets.password
})
return fmp2CopernicGateway.run()
  .then(function() {
    console.log("Fmp2Copernic running on port " +
      fmp2CopernicGateway.listener.address().port)
  })