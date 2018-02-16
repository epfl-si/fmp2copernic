/**
 * Main server class
 */
request = require('request');

const express = require('express'),
  _ = require("lodash"),
  ourExpress = require("./lib/our-express.js"),
  epflPeopleApi = require('epfl-people-api')


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
    epflPeopleApi.findBySciper(parseInt(req.query.sciper), 'en').then(function(person) {
      let option = {
        url: self.opts.protocol + '://' + backendBaseUrl + '/piq/RESTAdapter/api/sd/facture',
        json: {
          "header": {
            "ordertype": normalizeOrderType(req.query.ordertype),
            "ordernr": req.query.ordernr,
            "currency": req.query.currency,
            "clientnr": req.query.clientnr
          },
          "shipper": {
            "name": person.firstname + " " + person.name,
            "sciper": req.query.sciper,
            "fund": req.query.fund,
            "email": "michel.peiris@epfl.ch",
            "tel": "0216934760"
          },
          "items": {
            "number": req.query.number,
            "qty": req.query.qty,
            "price": req.query.price,
            "text": req.query.text
          },
          "execmode": req.query.execmode
        }
      }
      if (self.opts.user) {
        option.auth = {
          'user': self.opts.user,
          'pass': self.opts.password
        }
      }
      request.post(option, function(error, response) {
        try {
          if (error) throw error;
          if (response.statusCode !== 200) {
            throw new Error("Unexpected status code from COPERNIC: " + response.statusCode + " " + response.body);
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