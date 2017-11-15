let assert = require("assert"),
  Copernic = require("./mock/copernic.js"),
  request = require('request');


describe.only("tests for MockCopernic", function() {
  let fakeCopernic, fakeCopernicHostPort
  before(function() {
    fakeCopernic = new Copernic()
    return fakeCopernic.run().then(function(c) {
      fakeCopernicHostPort = c.getHostPort()
    })
  })
  after(function() {
    fakeCopernic.close();
  })
  it.only("serves a success", function(done) {
    //start a MockCopernic
    debugger

    fakeCopernic.handleNewfact = function() {
      return "12345"
    }
    request.post('http://' + fakeCopernicHostPort + '/piq/RESTAdapter/api/sd/facture', function(error, response) {
      console.log('port:', fakeCopernicHostPort); // Print the port number
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      if (error) {
        done(error)
      } else if (response.statusCode == 200) {
        done()
      } else {
        done(new Error("unexpcted statusCode:" + response.statusCode))
      }
    });
  })

  // use the npm module request to make a request and check the http code should be 200 and Content-Type should be application/json
  it("serves an error", function() {

  })
})


// .only for only one describe or it
