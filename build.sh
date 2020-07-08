if [ -z $HOST_BACK ]; then
    HOST_BACK='localhost';
    export HOST_BACK;
fi;

if [ -z $PORT_BACK ]; then
    PORT_BACK=3000;
    export PORT_BACK;
fi;

if [ -z $PORT_FRONT ]; then
    PORT_FRONT=3001;
    export PORT_FRONT;
fi;

if [ -z $HOST_FRONT ]; then
    HOST_FRONT='localhost';
    export HOST_FRONT;
fi;

chmod +x epr_frontend/build.sh
cd epr_frontend && ./build.sh && cd ..

docker-compose build && docker-compose up -d