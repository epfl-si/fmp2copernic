let assert = require('assert')

/**
 * @param pathNAS e.g. P:/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf
 * @param pathBASE e.g. /var/filemaker/documents
 * @return e.g. /var/filemaker/documents/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf
 */
function decodePath(pathBASE, pathNAS) {
  pathNAS = pathNAS.replace(/P:/i, '');
  return pathBASE + pathNAS
}
module.exports.decodePath = decodePath
module.exports.deletePoint = deletePoint