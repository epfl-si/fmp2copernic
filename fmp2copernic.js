/**
 * Main server class
 */
request = require('request');

const express = require('express'),
  _ = require("lodash"),
  ourExpress = require("./lib/our-express.js")

/**
 * @constructor
 * @param opts.port TCP port to serve on (0 to let the OS allocate it)
 * @param opts.copernicHostPort Copernic back-end address in host:port format
 */
function Fmp2CopernicGateway(opts) {
  let self = ourExpress.new(Fmp2CopernicGateway)
  self.opts = _.extend({
    port: 3000
  }, opts)
  let backendBaseUrl = self.opts.copernicHostPort
  self.get('/copernic/newfact', function(req, res) {
    request.post('http://' + backendBaseUrl + '/piq/RESTAdapter/api/sd/facture', function(error, response) {
      console.log(response.body);
      res.send("OK " + JSON.parse(response.body).E_RESULT.item.DOC_NUMBER);
    })
  })
  return self
}

module.exports = Fmp2CopernicGateway