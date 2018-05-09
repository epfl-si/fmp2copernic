/**
 * Constructor and additional methods for objects that are Express servers
 *
 * Example use:
 *
 * const our_express = require("./our-express.js")
 *
 * function MyClass() {
 *   let self = our_express.new(MyClass)   // Do *not* use this
 *   ...
 *   return self
 * }
 */

const _ = require("lodash"),
  Q = require("q"),
  express = require("express"),
  debug = require("debug")("our-express.js")

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
 * @returns {Promise} A Promise to this object
 */
function run() {
  let self = this
  let port = ('opts' in self) && ('port' in self.opts) ? self.opts.port : 0

  return new Promise(function(resolve, reject) {
    self.listener = self.listen(port)
    self.listener.on('listening', function() {
      debug(port, ' is listening on ', self.listener.address().port)
      resolve(self)
    })
    self.listener.on('error', function(err) {
      debug(port, ' led to ', err)
      reject(err)
    })
  })
}

function shutdown() {
  let self = this
  return new Promise(function(resolve, reject) {
    if (!"listener" in self) {
      resolve() // Never run()
    } else {
      self.listener.close(function(error) {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    }
  })
}

exports.new = function(superclass) {
  let self = new express()
  // Just like with express itself, self will be a function (not a plain object) and
  // will not be instanceof express - nor will it be instanceof superclass.
  // But for comfort, we still import the methods from the prototype
  _.assign(self, superclass.prototype, {
    run: run,
    shutdown: shutdown,
    close: shutdown
  })
  return self
}
