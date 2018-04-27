/**
 * Main server class
 */
request = require('request');

const express = require('express'),
  _ = require("lodash"),
  decodePath  = require('./decodePath.js').decodePath,
  util = require("util"),
  fs = require('fs'),
  ourExpress = require("./lib/our-express.js"),
  epflPeopleApi = require('epfl-people-api'),
  readFile = util.promisify(fs.readFile),
  debug = require('debug')('fmp2copernic');


/**
 * @constructor
 * @param opts.port TCP port to serve on (0 to let the OS allocate it)
 * @param opts.copernicHostPort Copernic back-end address in host:port format
 * @param opts.user set the user to send to copernic
 * @param opts.password set the password to send to copernic
 * @param opts.attachmentDirectory
 */
function Fmp2CopernicGateway(opts) {
  let self = ourExpress.new(Fmp2CopernicGateway)
  self.opts = _.extend({
    protocol: "http",
    port: 3000
  }, opts)
  let backendBaseUrl = self.opts.copernicHostPort
  self.get('/copernic/newfact', function(req, res) {
    debug('/copernic/newfact')
    let person = null,
      attachmentContents = null,
      fileContent = null,
      fileData = null,
      readFileOrDoNothingPromise


    if (req.query.PathDevisPDF) {
      readFileOrDoNothingPromise = readFile(decodePath(opts.attachmentDirectory,req.query.PathDevisPDF)).then(function(fc) {
        debug('Read ' + req.query.PathDevisPDF + ' from disk OK, size ' + fc.length + ' bytes')
        fileContent = fc
      })
    } else {
      readFileOrDoNothingPromise = new Promise((resolve) => {
        resolve()
      })
    }
    readFileOrDoNothingPromise.then(function() {
      return epflPeopleApi.findBySciper(parseInt(req.query.sciper), 'en')
    }).then(function(p) {
      person = p;
      let queryParams = normalize(req.query),
        option = {
          url: self.opts.protocol + '://' + backendBaseUrl + '/piq/RESTAdapter/api/sd/facture',
          json: {
            "header": {
              "ordertype": queryParams.ordertype,
              "ordernr": queryParams.ordernr,
              "currency": queryParams.currency,
              "clientnr": queryParams.clientnr,
              "fictr": queryParams.fictr
            },
            "shipper": {
              "name": person.firstname + " " + person.name,
              "sciper": queryParams.sciper,
              "fund": queryParams.fund,
              "email": "michel.peiris@epfl.ch",
              "tel": "0216934760"
            },
            "partners": [{
              "role": "AG",
              "fictr": "0052",
              "name2": "Station 7, 4ème Etage",
              "name3": "Mme M-T. Porchet",
              "email": "test@xyz.com"
            }],
            "items": {
              "number": queryParams.number,
              "qty": queryParams.qty,
              "price": queryParams.price,
              "text": queryParams.text
            },

            "execmode": queryParams.execmode
          }
        }
      if (self.opts.user) {
        option.auth = {
          'user': self.opts.user,
          'pass': self.opts.password
        }
      }
      if (fileContent) {
        option.json.attachment = [{
          "filename": queryParams.filename,
          "filetype": "application/pdf",
          "filesecription": "test attach",
          "filecontent": Buffer.from(fileContent).toString('base64')
        }]
      }
      request.post(option, function(error, response) {
        try {
          if (error) throw error;
          if (response.statusCode !== 200) {
            throw new Error("Unexpected status code from COPERNIC: " + response.statusCode + " " + response.body);
          }
          debug(JSON.stringify(response.body));
          res.send("OK " + response.body.E_RESULT.item.DOC_NUMBER);
        } catch (e) {
          res.status(500);
          res.send("ERROR " + e);
          debug(e);
        }
      })
    }).catch(function(e) {
      res.status(500);
      res.send("ERROR " + e);
      debug(e);
    })

  })
	return self
}

module.exports = Fmp2CopernicGateway


function normalize(query) {
  let normalized = {};
  if (query.ordertype == "INTERNE") {
    normalized.ordertype = "ZINT";
  } else if (query.ordertype == "EXTERNE") {
    normalized.ordertype = "ZEXT";
  } else {
    throw new Error("unknown ordertype " + ordertype);
  }
  if (!query.fictr && !query.clientnr) {
    throw new Error("no fictr or clientnr");
  } else if (query.fictr && query.clientnr) {
    throw new Error("you can't have fictr AND clientnr");
  } else if (query.fictr) {
    normalized.fictr = query.fictr;
  } else /*(clientnr)*/ {
    normalized.clientnr = query.clientnr;
  }
  if (!query.PathDevisPDF) {
    throw new Error("no PathDevisPDF");
  } else {
    normalized.PathDevisPDF = query.PathDevisPDF;
  }

  // XXX Improve
  normalized.ordernr = query.ordernr;
  normalized.qty = query.qty;
  normalized.price = query.price;
  normalized.currency = query.currency;
  normalized.fund = query.fund;
  normalized.text = query.text;
  normalized.sciper = query.sciper;
  normalized.number = query.number;
  normalized.execmode = query.execmode;

  return normalized;
}
