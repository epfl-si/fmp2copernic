#!/bin/bash
#Cryptage des credentials
#zf170418.1503

gpg2 -c ../fmp2copernic.credentials.js
mv ../fmp2copernic.credentials.js.gpg .
rm -R ../.gnupg
