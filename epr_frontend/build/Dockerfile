FROM node:8.10-alpine
RUN mkdir -p /src/app
WORKDIR /src/app
COPY . /src/app
RUN npm install express --save
EXPOSE 3001
CMD [ "node", "server.js" ]
