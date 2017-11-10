let assert = require("assert"),
  Copernic = require("./mock/copernic.js"),
  request = require('request');

request('http://localhost:3010/piq/RESTAdapter/api/sd/facture', function(error, response) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
});

describe.only("tests for MockCopernic", function() {
  before(function() {
    fakeCopernic = new Copernic()
    return fakeCopernic.run().then(function() {
      port: 0 // Let the OS pick a port
    })
  })

  it.only("serves a success", function() {
    //start a MockCopernic

    fakeCopernic.handleNewfact = function() {
      return "12345"
    }
  })

  // use the npm module request to make a request and check the http code should be 200 and Content-Type should be application/json
  it("serves an error", function() {

  })
})


// .only for only one describe or it
