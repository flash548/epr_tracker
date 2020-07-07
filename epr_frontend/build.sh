
# run this to build the prod ready version of the app
npm run-script build
cp deploy/Dockerfile build/Dockerfile
cp deploy/server.js build/server.js