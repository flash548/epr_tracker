FROM node:8.10-alpine
RUN mkdir -p /src/app
WORKDIR /src/app
COPY . /src/app
RUN npm install dotenv --save 
RUN yarn install
EXPOSE ${PORT_BACK}
CMD [ "node", "index.js" ]
