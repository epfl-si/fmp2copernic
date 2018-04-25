let assert = require('assert'),
  rp = require('request-promise-native'),
  decodePath = require('../decodePath.js').decodePath,
  deletePoint = require('../decodePath.js').deletePoint,
  debug = require('debug')('decodePathTest');
describe('DECODE', function() {
  it('exists', function() {
    assert.ok(decodePath instanceof Function, "decodePath instanceof Function");
  })

  it("decodes", function() {
    assert.equal(decodePath("/var/filemaker/documents", "P:/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf"), "/var/filemaker/documents/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf")
  })

  it("throws on /../", function() {
    let url = decodePath("/var/filemaker/documents", "P:/ATPR/Travaux/2017/../STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf");
    try {
      deletePoint(url);
      assert.fail("should not be throw (no error)");
    } catch (err) {
      assert(err instanceof Error);
      assert.equal(err.message, 'Wrong value');
      debug(err);
    }
  })
})