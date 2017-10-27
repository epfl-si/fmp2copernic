exports.promisify = function promisify(thing) {
  if (thing instanceof Promise) {
    return thing
  } else if (thing instanceof Function) {
    return new Promise(function(resolve, reject) {
      try {
        resolve(thing())
      } catch (e) {
        reject(e)
      }
    })
  } {
    return new Promise(function(resolve) {
      resolve(thing)
    })
  }
}
