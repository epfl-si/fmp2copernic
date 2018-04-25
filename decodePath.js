let assert = require('assert'),
  debug = require('debug')('decodePath');

/**
 * @param pathNAS e.g. P:/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf
 * @param pathBASE e.g. /var/filemaker/documents
 * @return e.g. /var/filemaker/documents/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf
 */
function decodePath(pathBASE, pathNAS) {
  pathNAS = pathNAS.replace(/P:/i, '');
  let finalPath = pathBASE + pathNAS;
  checkPoint(finalPath);
  return finalPath
}

function checkPoint(path) {

  debug(path.match(/\.\./i, ''));
  if (path.match(/\.\./i, '') != null) {
    debug("it is not OK");
    throw new Error('Wrong value');
  } else {

    debug("it is OK");
    return
  }
}

module.exports.decodePath = decodePath
module.exports.checkPoint = checkPoint