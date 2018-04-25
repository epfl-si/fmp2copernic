let assert = require('assert'),
  rp = require('request-promise-native'),
  decodePath = require('../decodePath.js').decodePath,
  deletePoint = require('../decodePath.js').deletePoint
describe.only('DECODE', function() {
  it('exists', function() {
    assert.ok(decodePath instanceof Function, "decodePath instanceof Function");
  })

