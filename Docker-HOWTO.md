## Starting a New Docker Stack

* Make sure you have your directory structures correct.  There should be an overall, overarching directory
holding your project (e.g. `epr_tracker` was mine).

* Inside the that directory you should have subfolders representing the individual services/containers you want 
to comprise your stack.  (e.g. `epr_frontend`, `epr_backend`, `epr_tracker_db`)

* Inside each subfolder you'll want to create a `Dockerfile` 
    
* At the project folder level itself - you'll want to create a `docker-compose.yml` file.  There should only be one
of these files for the entire project.

## Making the Files

* First make the `docker-compose.yml` file in your app's main folder.  In it, we'll place just the backend and db for 
now to test.  We'll add the frontend later.

**NOTE: Make sure you take note of the port you use here for the backend (e.g. 4000)**

* `docker-compose.yml` should look something like this:

```
version: '3'

services:
backend:
    build: backend/
    container_name: backend
    depends_on:
    - 'database'
    ports:
    - 4000:4000

database:
    build: appdb
    container_name: appdb
    volumes:
    - myappdata:/var/lib/postgresql/data
    environment:
    POSTGRES_PASSWORD: "password"
    POSTGRES_USER: "postgres"
    POSTGRES_DB: "postgres"

# Persists data across deployments so data isn't lost
volumes:
myappdata:
    driver: local

```

* Dockerize your express backend.  This will involve making the `Dockerfile` in your backend/express subfolder.  An example `Dockerfile` for the backend would look like this, where the EXPOSE line would be the port you want the backend API to run on (needs to match the earlier one from your `yml` file).  

**NOTE: Make sure in your CODE of the express server, the `listen` port is the same too.**

```
FROM node:8.10-alpine
RUN mkdir -p /src/app
WORKDIR /src/app
COPY . /src/app
RUN yarn install
EXPOSE 4000 
CMD [ "node", "index.js" ]
```

* Now build out a `Dockerfile` in the app's database subfolder.  A sample one for PG might look like:

```
FROM postgres:latest
ENV POSTGRES_USER postgres
ENV POSTGRES_PASSWORD password
ENV POSTGRES_DB postgres
COPY seed.sql /docker-entrypoint-initdb.d/seed.sql
RUN mkdir -p /src/app
WORKDIR /src/app
COPY . /src/app
EXPOSE 5432
```

* Make sure the ENVs listed above match what was in the `yml` file earlier.

* Now the important part here is to make sure you change your PG connection pool criteria to use the user/pass/db strings in the ENV commands above.  Also in that same
connection pool code on the backend, make sure your hostname to the db matches the service name of the 'appdb' in the `yml` file (which in this case was `database`).  So your express JS connection pool code should look something like this if you're following along with the example:

```
const pool = new Pool({
  user: 'postgres',
  host: 'database',
  database: 'postgres',
  password: 'password',
  port: 5432,
})
```

* Also make sure you have a `seed.sql` file in your app's db subfolder too, as it will be placed into the db's init folder so the db gets seeded upon container launch.

* Now you're ready to test the db+backend.  Go to the same directory as your `docker-compose.yml` file and at the command like do `docker-compose build`.  Make sure you have no errors, then do `docker-compose up -d`.  This should start your two containers.

* Once their up and running do: `docker logs backend` and make sure you see that the backend is listening on whatever port you chose earlier.

* Then do `docker logs appdb` and see that the PG server is running/listening.

* Now go to a browser and do a manual API GET request on your API.  You should be getting data back as expected.

* Now tear down the stack with `docker-compose down --rmi all`.

## Now Add the Front End

The only thing we need to do now is add the web React frontend.  We want to do a production build of the frontend - otherwise the frontend will be nearly 250MB in size.  Before we do this, choose another host/port combo for your front end, you'll need that later, but first in your React app you need to update the url to the backend and make sure that's correct (which it may need to be something different than http://localhost:3000 in order to work on a new host).  So if that's configured correctly, then go ahead and add in the frontend service (under 'services') to the `docker-compose.yml` file.  Should look something like this - which ports may need to change...

```
frontend:
    build: epr_frontend/build/
    container_name: frontend
    depends_on:
      - 'backend'
    ports:
      - 3000:3000
```
* Now make the `Dockerfile` for the front end inside the `frontend` subfolder.  Should look something like this.  AGAIN PORT NUMBER NEEDS TO MATCH WHATS IN THE FRONTEND SERVICE IN THE COMPOSE FILE.

```
FROM node:8.10-alpine
RUN mkdir -p /src/app
WORKDIR /src/app
COPY . /src/app
RUN npm install express --save
RUN npm install dotenv --save
EXPOSE 3000
CMD [ "node", "server.js" ]
```

* This code will run the slimmed down production build of your react app using express's static serving capabilities.  You may notice too that you need to have a new file named `server.js` - and you are correct.  This file is what will create the `express` web-server to serve your React app.  So make a new file named `server.js` in your front-end folder.  Its content should be:

```
const express = require('express')
const app = express()
const path = require('path');
const port = 3000;

let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
}
app.use(allowCrossDomain);

console.log(__dirname);
app.use('/', express.static(path.join(__dirname, '.')));
app.use('/', express.static(path.join(__dirname, '/static')));
app.use(express.static(path.join(__dirname, '/static/css')));
app.use(express.static(path.join(__dirname, '/static/js')));

app.listen(port, () => {
    console.log(`epr_tracker frontend running on port ${port}.`)
  })

```

**Again here we need to change the port to something your want to reach your frontend from**

* Now go to a command line prompt inside your `frontend` directory and run `npm run-script build`.  This will build your React app and place the production ready contents in the `build/` directory.  

**Now copy the `server.js` to the `build/` directory and also copy your `Dockerfile` to the `build/` directory too.**

* Now do the whole thing again, go to the app's top level directory and run the `docker-compose` file with -- `docker-compose up -d`.  If all goes well the backend/db and now frontend will be active.  Confirm the fronend is active by going to a browser and going to the host/port you chose for the front end.

* To stop everything do `docker-compose down --rmi all`

**NOTE: IF YOU MAKE ANY CHANGES TO REACT, YOU MUST REBUILD USING `npm` AND THEN RE-COPY IN THE SERVER.JS and `Dockerfile` BEFORE RUNNING `docker-compose` AGAIN.**







