let assert = require("assert"),
  Copernic = require("./mock/copernic.js")

describe.only("tests for MockCopernic", function() {
  it("serves a success", function() {
    //start a MockCopernic
    var mockCopernic = new Copernic;
    ...;
    ...;

    mockCopernic.handleNewfact = function() {
      return "12345"
    }

    // use the npm module request to make a request and check the http code should be 200 and Content-Type should be application/json
  })
  it("serves an error", function() {

  })
})


// .only for only one describe or it
