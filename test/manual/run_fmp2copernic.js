/**
 * Run a real Fmp2CopernicGateway
 */


let Fmp2CopernicGateway = require("../../fmp2copernic.js"),
  fmp2CopernicGateway,
  fs = require('fs'),
  _ = require('lodash'),
  morgan = require('morgan');

let config = JSON.parse(fs.readFileSync('config.json')),
  secrets = JSON.parse(fs.readFileSync('secrets.json'));
let copernicGatewayOpts = _.extend({
  port: 3000,
  copernicHostPort: "sapservices.epfl.ch",
  protocol: "http"
}, config, secrets)
fmp2CopernicGateway = new Fmp2CopernicGateway(copernicGatewayOpts)
fmp2CopernicGateway.use(morgan('combined'))

return fmp2CopernicGateway.run()
  .then(function() {
    console.log("Fmp2Copernic running on port " +
      fmp2CopernicGateway.listener.address().port)
  })
