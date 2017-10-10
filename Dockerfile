# Dockerized fmp2copernic
# See https://nodejs.org/en/docs/guides/nodejs-docker-webapp/ for info
#
# After every change do:
#
#   docker build -t epflsti/fmp2copernic-server .
#   docker service rm fmp2copernic_server
#   docker deploy fmp2copernic --compose-file docker-compose.yml 
FROM node
WORKDIR /usr/src/app

COPY package.json ./
RUN npm install
COPY *.js ./
EXPOSE 3000
CMD [ "npm", "start" ]
