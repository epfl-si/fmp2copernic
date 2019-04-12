const _ = require("lodash")

const fakeScipers = {
  243371: {
    firstname: "Dominique",
    name: "Quatravaux",
    fund: "F0385-1",
    email: "dominique.quatravaux@epfl.ch",
    phones: "+41216935624"
  },
  271774: {
    firstname: "Nicolas",
    name: "Reymond",
    fund: "F0385-1",
    email: "nicolas.reymond@epfl.ch",
    phones: "+41216931234"
  }
}

module.exports.findBySciper = function(sciper, lang) {
  return new Promise(function (resolve, reject) {
    process.nextTick(function() {
      if (fakeScipers[sciper]) {
        resolve(_.extend({}, fakeScipers[sciper], {sciper}))
      } else {
        reject()
      }
    })
  })
}
