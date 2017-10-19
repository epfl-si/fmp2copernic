exports.promisify = function promisify(thing) {
    if (thing instanceof Promise) {
        return thing
    } else {
        return new Promise(function(resolve) { resolve(thing) })
    }
}
