/**
 * Main server class
 */
request = require('request');

const express = require('express'),
  path = require('path'),
  _ = require("lodash"),
  decodePath = require('./decodePath.js').decodePath,
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
    copernicBaseURL: "/piq/RESTAdapter/api",
    port: 3000
  }, opts)
  let backendBaseUrl = self.opts.copernicHostPort
  self.get('/copernic/newfact', function(req, res) {
    debug(req.protocol + '://' + req.get('host') + req.originalUrl)
    let person = null,
      attachmentContents = null,
      fileContent = null,
      fileData = null,
      readFileOrDoNothingPromise;

    if (req.query.PathDevisPDF) {
      readFileOrDoNothingPromise = readFile(decodePath(opts.attachmentDirectory, req.query.PathDevisPDF)).then(function(fc) {
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
      let queryParams = normalize(req.query);
      let url = self.opts.protocol + '://' + backendBaseUrl + self.opts.copernicBaseURL + '/sd/facture';
      let option = {
        url: url,
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
            "email": person.email,
            "tel": person.phones.split(',')[0]
          },
          "partners": [],
          "items": queryParams.items,

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
          "filename": path.basename(queryParams.PathDevisPDF),
          "filetype": "application/pdf",
          "filesecription": "test attach",
          "filecontent": Buffer.from(fileContent).toString('base64')
        }]
      }
      if (debug.enabled) {
        let json = _.cloneDeep(option.json)
        for (let attachment of json.attachment) {
          if (attachment.filecontent) {
            attachment.filecontent = '[...]'
          }
        }
        debug(json)
      }
      request.post(option, function(error, response) {
        try {
          if (error) throw error;
          if (response.statusCode !== 200) {
            serveError(res, "Unexpected status code from COPERNIC: " + response.statusCode + " " + response.body);
            return;
          }
          debug(JSON.stringify(response.body));
          if (response.body.E_RESULT.item.IS_ERROR) {
            serveError(res, response.body.E_RESULT.item.LOG.item.MESSAGE);
            return;
          }
          res.send("OK " + response.body.E_RESULT.item.DOC_NUMBER);
        } catch (e) {
          serveError(res, e);
        }
      })
    }).catch(function(e) {
      serveError(res, e);
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
  if (query.PathDevisPDF) {
    normalized.PathDevisPDF = query.PathDevisPDF;
  }

  // XXX Improve
  normalized.ordernr = query.ordernr;
  normalized.currency = query.currency;
  normalized.fund = query.fund;
  normalized.sciper = query.sciper;
  normalized.execmode = query.execmode;

  normalized.items = [];
  function maybe_push_item(text, qty, number, price) {
    if (qty) {
      normalized.items.push({
        qty: Number(qty),
        number,
        price,
        text
      })
    }
  }

  maybe_push_item(query.text, query.qty, query.number, query.price)
  for(let i = 0; (i < 2) || query["qty" + i]; i++) {
    maybe_push_item(query["text" + i], query["qty" + i], query["number" + i], query["price" + i])
  }

  return normalized;
}


function serveError(res, e) {
  res.status(500);
  res.send("ERROR " + e);
  debug(e);
}
