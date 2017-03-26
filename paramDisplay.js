/**
 * Created by ismailbouanani on 02.01.17.
 */
var http = require('http');
var url = require('url');
var qS = require('querystring');

var instructionsNewUser = function(req,res){


    var params = qS.parse(url.parse(req.url).query);
    res.writeHead(200, {"Content-Type": "text/html"});
    if ('name' in params && 'sciper' in params) {
        //res.write('Client: ' + params['name'] + ' sciper:' + params['sciper']);
        //res.write('<button onclick="myFunction()">Afficher facture</button>');
        res.write('<!DOCTYPE html>'+
            '<html>'+
            '    <head>'+
            '        <meta charset="utf-8" />'+
            '        <title>Affichage du client et du pdf !</title>'+
            '    </head>'+
            '    <body>'+
            '     	<p> Client: ' + params['name'] + ' sciper: ' + params['sciper'] + '</p>'+
            '       <button onclick="window.open'+'( \'https://checkout.lemonde.fr/glm_onestepcheckout/onestep/downloadPdf/\', \'_blank\', \'fullscreen=yes\'); return false;">'+'Afficher facture</button>'+
    // lien du pdf (que j'ai utilisé en guise de test) a remplacer par params['PathFacturePDF']
            '    </body>'+
            '</html>');
        res.end();

    }

    res.end();






}

var server = http.createServer(instructionsNewUser);
server.listen(8080);

