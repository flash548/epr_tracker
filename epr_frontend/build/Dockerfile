FROM node:8.10-alpine
RUN mkdir -p /src/app
WORKDIR /src/app
COPY . /src/app
RUN npm install express --save
RUN npm install dotenv --save
EXPOSE ${PORT_FRONT}
CMD [ "node", "server.js" ]
