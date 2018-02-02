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
   * @param opts.user set the user to send to copernic
   * @param opts.password set the password to send to copernic
   */
  function Fmp2CopernicGateway(opts) {
    let self = ourExpress.new(Fmp2CopernicGateway)
    self.opts = _.extend({
      protocol: "http",
      port: 3000
    }, opts)
    let backendBaseUrl = self.opts.copernicHostPort
    self.get('/copernic/newfact', function(req, res) {
      fetchPersonalData(req.query.sciper).then(function(personalData) {
        let option = {
          url: self.opts.protocol + '://' + backendBaseUrl + '/piq/RESTAdapter/api/sd/facture',
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
        }
        if (self.opts.user) {
          debugger
          option.auth = {
            'user': self.opts.user,
            'pass': self.opts.password
          }
        }
        debugger
        request.post(option, function(error, response) {
          try {
            if (error) throw error;
            if (response.statusCode !== 200) {
              throw new Error("Unexpected status code from COPERNIC: " + response.statusCode);
            }
            res.send("OK " + response.body.E_RESULT.item.DOC_NUMBER);
          } catch (e) {
            res.status(500);
            res.send("ERROR " + e);
            console.log(e);
          }
        })
      }).catch(function(e) {
        res.status(500);
        res.send("ERROR " + e);
        console.log(e);
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
      throw new Error("unknown ordertype " + ordertype);
    }
  }

  function fetchPersonalData() {
    return new Promise(function(resolve, reject) {
      process.nextTick(function() {
        resolve({})
      })
    })
  }