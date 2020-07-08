# epr_tracker

This is a Docker stack consisting of a
* React front end
* Express back end
* Postgres DB 

that represents an independent microservice that allows viewing of USAF EPRs/ACA dates by user.

## Docker Notes
* Clone this repo
* `cd` to cloned repo directory
* Issue command `./build.sh` (to accept localhost:3000 as backend and localhost:3001 as frontend)
* OR `PORT_FRONT=3001 PORT_BACK=3000 HOST_BACK=localhost HOST_FRONT=localhost ./build.sh` and replace ports/hosts with what you want
* Use browser go to `http://localhost:3001/?firstname=adam&lastname=baker` (or whatever port you used for $PORT_FRONT)
* To tear down `docker-compose down --rmi all`



POSTGRES SCHEMA (ERD):

![Image of ERD](https://github.com/flash548/epr_tracker/blob/master/users.png)
