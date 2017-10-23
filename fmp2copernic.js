/**
 * Main server class
 */

const express = require('express'),
  _ = require("lodash")

/**
 * @constructor
 * @param opts.port TCP port to serve on (0 to let the OS allocate it)
 * @param opts.copernicHostPort Copernic back-end address in host:port format
 */
module.exports = Fmp2CopernicGateway = function Fmp2CopernicGateway(opts) {
  this.opts = _.extend({
    port: 3000
  }, opts)
}

/**
 * Called by run()
 */
Fmp2CopernicGateway.prototype._setupExpress = function(express) {
  let backendBaseUrl = this.opts.copernicHostPort

  express.get('/copernic/newfact', function(req, res) {
    res.send('Hello World!')
  })
}

/**
 * Run the proxy server
 *
 * @returns {Promise}
 */
Fmp2CopernicGateway.prototype.run = require("./lib/express-server-mixin.js").run
