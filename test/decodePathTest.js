let assert = require('assert'),
  rp = require('request-promise-native'),
  decodePath = require('../decodePath.js').decodePath,
  checkPoint = require('../decodePath.js').checkPoint,
  debug = require('debug')('decodePathTest'),
  badWinPath = "P:/ATPR/Travaux/2017/../STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf";
describe('decodePath', function() {
  it('exists', function() {
    assert.ok(decodePath instanceof Function, "decodePath instanceof Function");
  })

  it("decodes", function() {
    assert.equal(decodePath("/var/filemaker/documents", "P:/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf"),
      "/var/filemaker/documents/ATPR/Travaux/2017/STI-DO/Quatravaux Dominique Hervé Claude/25.09.2017-OF-4/Devis_OF-4-2017.pdf")
  })

  it("throws on /../", function() {

    try {
      decodePath('', badWinPath);
      assert.fail("should not be throw (no error)");
    } catch (err) {
      assert(err instanceof Error);
      assert.equal(err.message, 'Wrong value');
      debug(err);
    }
  })
  describe('checkPoint', function() {

    it("throws on /../", function() {
      try {
        checkPoint(badWinPath);
        assert.fail("should not be throw (no error)");
      } catch (err) {
        assert(err instanceof Error);
        assert.equal(err.message, 'Wrong value');
        debug(err);
      }
    })
  })
})