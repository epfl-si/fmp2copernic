let assert = require("assert"),
  Copernic = require("./mock/copernic.js"),
  request = require('request');


describe("tests for MockCopernic", function() {
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
  it("serves a success", function(done) {
    //start a MockCopernic

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








  it("serves an error", function(done) {
    var handledNewfact = false;
    fakeCopernic.handleNewfact = function() {
      handledNewfact = true;
      throw new Error
    }

    request.post('http://' + fakeCopernicHostPort + '/piq/RESTAdapter/api/sd/facture', function(error, response) {

      console.log('port:', fakeCopernicHostPort); // Print the port number
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      if (error) {
        console.log("ne panique pas, c'est ce qu'on veut");
        done(error)
      } else if ((response.statusCode == 500) && fakeCopernic.caughtException) {
        done()
      } else if (!fakeCopernic.caughtException) {
        if (!handledNewfact) {
          done(new Error("We didn't even reach handleNewfact"))
        } else {
          done(new Error("Uh, I'm not even sure how this went wrong - But it did"))
        }
      } else {
        done(new Error("unexpcted statusCode:" + response.statusCode))
      }

    });
  })
})


// .only for only one describe or it
