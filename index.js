var express = require('express')
var serveStatic = require('serve-static')
var morgan = require('morgan')
var convert = require('xml-js')
var fs = require('fs')
var fetch = require("whatwg-fetch")
var request = require('request')

var secrets = require('./credentials')

var app = express()

// for error handling
app.use(morgan('combined'))

// greeting page, might want to print a help message to use all command possible with the server.
app.get('/', function (req, res) {
  res.send('Bloub World!')
})

// to serve static files from public_data folder
app.use(serveStatic('public_data',  {'index': ['index.html', 'index.htm']}))

// parse xml file to be able to use it
var xml = fs.readFileSync('public_data/users.xml', 'utf8');
var options = {ignoreText: true, alwaysChildren: true};
var users = convert.xml2js(xml, options);

app.get('/users', function (req, res) {
  res.send(users)
})

function change_path(path, old_dir, new_dir) {
  return new_dir.concat(path.slice(old_dir.length));
}

function getBase64(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

app.get('/copernic', function (req, res) {
  newfacture_adress = change_path(req.query['PathFacturePDF'], 'Z:/PDF devis_factures/ATPR/Cheseaux Claude/18.03.2017-OF-216', './build/pdf')
  newdevis_adress = change_path(req.query['PathDevisPDF'], 'Z:/PDF devis_factures/ATPR/Cheseaux Claude/18.03.2017-OF-216', './build/pdf')
  post_content = {
    "header": {
      "ordertype": req.query["ordertype"],
      "ordernr": req.query["ordernr"],
      "currency": req.query["currency"],
      "clientnr": req.query["clientnr"],
      /*"description": "Texte d'En-Tête",
      "changevalidation" : false
      */
    },
    "shipper": {
      "name": req.query["name"],
      "sciper": req.query["sciper"],
      "fund": req.query["fund"],
      /*"email": "michel.peiris@epfl.ch",
      "tel": "0216934760"
      */
    },
    /*"shipper_imputation": {
      "opcode": "",
      "ordernr": "",
      "otp": "",
      "affaire": "",
      "travelreqnr": "",
      "travelreqmatnr": ""
    },
    "payer_imputation": {
      "fund": "",
      "fundrate": ""
    },*/
    "attachment": [
      {
        "filename": newfacture_adress.slice(newfacture_adress.lastIndexOf('/')+1),
        "filetype": "application/pdf",
        "filesecription": "test attach",
        "filecontent": getBase64(newfacture_adress)
      },{
        "filename": newdevis_adress.slice(newdevis_adress.lastIndexOf('/')+1),
        "filetype": "application/pdf",
        "filesecription": "test attach",
        "filecontent": getBase64(newdevis_adress),
        "fileprivate": true
      }
    ],
    /*"partners": [
      {
        "role": "AG",
        "fictr": req.query["fictr"],
        "name2": "Station 7, 4ème Etage",
        "name3": "Mme M-T. Porchet",
        "email": "test@xyz.com"
      }
    ],*/
    "items": [
      {
        "number": req.query["number"],
        "qty": req.query["qty"],
        "price": req.query["price"],
        "text": req.query["text"],
        /*"discounttype": "ZD01",
        "discountamount": "50",
        "shipper_imputation": {
          "opcode": "aaa",
          "ordernr": "",
          "otp": "",
          "travelreqnr": "",
          "travelreqmatnr": ""
        },
        "payer_imputation": [
          {
            "fund": "1320-1",
            "fundrate": "50",
            "opcode": "aaa",
            "ordernr": "",
            "otp": "",
            "travelreqnr": "",
            "travelreqmatnr": ""
          }, {
            "fund": "1320-2",
            "fundrate": "50",
            "opcode": "bbb",
            "ordernr": "",
            "otp": "",
            "travelreqnr": "",
            "travelreqmatnr": ""
          }
        ]*/
      },
      /*{
        "number": "9010136",
        "qty": 1,
        "price": "200",
        "text": "Texte du poste 2",
        "internalconsoname": "Dr. Tartenpion"
      }*/
    ],
    "execmode": req.query["execmode"]
  }
  auth = "Basic " + new Buffer(secrets.username + ":" + secrets.password).toString("base64");
  request.post({
      url:'https://sapservices.epfl.ch/piq/RESTAdapter/api/sd/facture',
      postData:post_content,
      headers:{
        "Authorization" : auth
      }
    },
    function (error, response, body) {
      if(error) {
        console.log("sent and received error :(")
        res.send(error)
      }
      else if (!error && response.statusCode == 200) {
        console.log("sent and received answer !")
        res.send(body)
      }
      else
      {
        console.log("received somthing else")
        res.send(response)
      }
    }
);
})

app.listen(3000, function() {
    console.log('App fmp2copernic listening on port 3000!')
})

