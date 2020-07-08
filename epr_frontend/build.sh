
# build the react app for production
cp src/App.js src/App.js.bak
sed -i -e "s#<prod url here>#http://$HOST_BACK:$PORT_BACK#" src/App.js
if [ $? != '0' ]; then echo "Failed to config prod url!"; exit 1; fi;
npm run-script build
cp deploy/Dockerfile build/Dockerfile
cp deploy/server.js build/server.js
mv src/App.js.bak src/App.js





