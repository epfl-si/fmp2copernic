let assert = require("assert"),
  MockCopernic = require("./mock/copernic.js"),
  request = require('request'),
  rp = require('request-promise-native'),
  debug = require('debug')('mockCopernicTests');


describe("tests for MockCopernic", function() {
  let fakeCopernic, fakeCopernicHostPort
  before(function() {
    fakeCopernic = new MockCopernic()
    return fakeCopernic.run().then(function(c) {
      fakeCopernicHostPort = c.getHostPort()
    })
  })
  after(function() {
    fakeCopernic.close();
  })
  it("serves a success", function(done) {
    fakeCopernic.handleNewfact = function() {
      return "12345"
    }
    request.post('http://' + fakeCopernicHostPort + '/piq/RESTAdapter/api/sd/facture', function(error, response) {
      debug('port:', fakeCopernicHostPort); // Print the port number
      debug('error:', error); // Print the error if one occurred
      debug('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      if (error) {
        done(error)
      } else if (response.statusCode == 200) {
        done()
      } else {
        done(new Error("unexpcted statusCode:" + response.statusCode))
      }
    });
  })


  it("serves a Copernic-style application error", function() {
    let handledNewfact = false;
    fakeCopernic.handleNewfact = function() {
      handledNewfact = true;
      throw new MockCopernic.ClientError("No deal");
    }

    return rp.post({
      uri: 'http://' + fakeCopernicHostPort + '/piq/RESTAdapter/api/sd/facture',
      resolveWithFullResponse: true,
      simple: false
    }).then(function(response) {
      assert.equal(true, handledNewfact)
      assert.equal(200, response.statusCode)
      let e = JSON.parse(response.body)
      // The real Copernic actually behaves like this:
      assert.equal("", e.E_RESULT.item.DOC_NUMBER)
      assert.equal("X", e.E_RESULT.item.IS_ERROR)
      assert.equal("E", e.E_RESULT.item.LOG.item.TYPE)
      assert.equal("No deal", e.E_RESULT.item.LOG.item.MESSAGE)
    })
  })
})


// .only for only one describe or it

//read doc of "request node js"
//use "node request parse" to parse the JSON
