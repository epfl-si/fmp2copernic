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
    request.post({
      url: 'http://' + backendBaseUrl + '/piq/RESTAdapter/api/sd/facture',
      json: {
        header: {
          clientnr: 219253
        },
        "header": {
          "ordertype": normalizeOrderType(req.query.ordertype)
        },
        "shipper": {
          "name": "Michel Peiris",
          "sciper": req.query.sciper,
          "fund": "0052-2",
          "email": "michel.peiris@epfl.ch",
          "tel": "0216934760"
        }
      }
    }, function(error, response) {
      try {
        if (error) throw error;
        if (response.statusCode !== 200) {
          throw new Error("Unexpected status code from COPERNIC: " + response.statusCode);
        }
        res.send("OK " + response.body.E_RESULT.item.DOC_NUMBER);
      } catch (e) {
        res.send("ERROR " + e)
      }
    })
  })
  return self
}

module.exports = Fmp2CopernicGateway


function normalizeOrderType(ordertype) {
  if (ordertype == "INTERNE") {
    return "ZINT";
  } else if (ordertype == "EXTERNE") {
    return "ZEXT";
  } else {
    throw new Error("unknow ordertype" + ordertype);
  }
}