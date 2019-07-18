'use strict'
/**
 * Main server class
 */

const express = require('express'),
  request = require('request'),
  rp = require('request-promise-native'),
  path = require('path'),
  _ = require("lodash"),
  decodePath = require('./decodePath.js').decodePath,
  util = require("util"),
  fs = require('fs'),
  ourExpress = require("./lib/our-express.js"),
  readFile = util.promisify(fs.readFile),
  debug = require('debug')('fmp2copernic');

/**
 * Helper class to parse attachment names
 */
const AttachmentNames = {
  mimeTypes: {
    PDF  : "application/pdf",
    GIF  : "image/gif",
    PNG  : "image/png",
    JPG  : "image/jpeg",
    JPEG : "image/jpeg"
  },
  match(prefix, paramName) {
    let matched
    for (let k in AttachmentNames.mimeTypes) {
      if (matched = paramName.match(new RegExp("^" + prefix + "(\\w+)" + k + "$"))) {
        return [matched[1], AttachmentNames.mimeTypes[k]]
      }
    }
  }
}

function base64(str) {
  return Buffer.from(str).toString('base64')
}

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
  let epflPeopleApi = (opts.inject && opts.inject.epflPeopleApi) || require('epfl-people-api')
  self.opts = _.extend({
    protocol: "http",
    copernicBaseURL: "/piq/RESTAdapter/api",
    port: 3000
  }, opts)
  let backendBaseUrl = self.opts.protocol + '://' + self.opts.copernicHostPort + self.opts.copernicBaseURL

  self.get('/copernic/newfact', async function(req, res) {
    debug(req.protocol + '://' + req.get('host') + req.originalUrl)
    try {
      await doNewfact.call(
        _.extend({}, self.opts, {backendBaseUrl, epflPeopleApi}),
        req, res)
    } catch (e) {
      serveError(res, e)
    }
  })

  self.get('/copernic/facture/:factureNo/statutTexte', function(req, res) {
    let opts = rp_opts('/sd/facture/' + req.params.factureNo)
    console.log(opts)
    rp(opts)
    .then(function(response) {
      res.send(JSON.parse(response).status)
    }).catch(function(e) {
      serveError(res, e);
    })
  })

  self.get('/copernic/facture/:factureNo/statutCode', function(req, res) {
    let opts = rp_opts('/sd/facture/' + req.params.factureNo)
    console.log(opts)
    rp(opts)
    .then(function(response) {
      res.send(JSON.parse(response).status_code)
    }).catch(function(e) {
      serveError(res, e);
    })
  })

  return self

  function rp_opts(uri) {
    let option = {uri: backendBaseUrl + uri}
    if (self.opts.user) {
      option.auth = {
        'user': self.opts.user,
        'pass': self.opts.password
      }
    }
    return option
  }
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

async function doNewfact (req, res) {
 let attachmentContents = null,
     fileContent = null,
     fileData = null,
     attachments = []

  // Load attachments from disk
  for (let k in req.query) {
    let matched
    if (matched = AttachmentNames.match("Path", k)) {
      let attachmentPath = decodePath(this.attachmentDirectory,
                                      req.query[k])
      let [description, mimeType] = matched
      attachments.push({
        "filename": path.basename(attachmentPath),
        "filetype": mimeType,
        "filedescription": description,
        "filecontent": base64(await readFile(attachmentPath))
      })
    }
  }

  let person = await this.epflPeopleApi.findBySciper(
    parseInt(req.query.sciper), 'en')

  let queryParams = normalize(req.query)
  let url = this.backendBaseUrl + '/sd/facture'
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
  if (this.user) {
    option.auth = {
      'user': this.user,
      'pass': this.password
    }
  }

  if (attachments.length) {
    option.json.attachment = attachments
  }
  if (debug.enabled) {
    let json = _.cloneDeep(option.json)
    if (json.attachment) {
      for (let attachment of json.attachment) {
        if (attachment.filecontent) {
          attachment.filecontent = '[...]'
        }
      }
    }
    debug(json)
  }

  let response = await util.promisify(request.post)(option)

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
}
