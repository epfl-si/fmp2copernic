/**
 * Methods for objects that are Express servers
 *
 * Example use:
 *
 * MyClass.prototype.run = require("mixins/server.js").run
 */

const Express = require("express"),
  promisify = require("./promises.js").promisify

/**
 * Create and run an Express server for this object.
 *
 * If this object has a _setupExpress method, it will first be called as
 * `this._setupExpress(app)`. This is the place to configure `app` with
 * `app.get()` etc.
 *
 * If this object has a this.opts.port, it should be an integer indicating which
 * TCP port to serve on. If this.opts.port is absent or zero, an ephemeral port
 * will be assigned by the OS.
 *
 * @returns {Promise} A Promise to the Express object
 */
exports.run = function run() {
  let self = this
  let port = ('opts' in self) && ('port' in self.opts) ? self.opts.port : 0
  const express = Express()

  let listenAndRunPromise = function() {
    return new Promise(function(resolve, reject) {
          express.on("error", reject)
          let listener = express.listen(port, function() {
              express.listener = listener
              resolve(express)
          })
      })
  }
  if ('_setupExpress' in self) {
    return promisify(self._setupExpress(express)).then(listenAndRunPromise)
  } else {
    return listenAndRunPromise()
  }
}
