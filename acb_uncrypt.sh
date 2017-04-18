#!/bin/bash
#Décryptage des credentials
#zf170418.1503

gpg2 fmp2copernic.credentials.js.gpg
mv fmp2copernic.credentials.js ../.
rm -R ../.gnupg
