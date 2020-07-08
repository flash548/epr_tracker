# epr_tracker

This is a Docker stack consisting of a
* React front end
* Express back end
* Postgres DB 

that represents an independent microservice that allows viewing of USAF EPRs/ACA dates by user.

## Docker Notes
* Clone this repo
* `docker-compose up -d`
* Use browser go to `http://localhost:3001/?firstname=adam&lastname=baker` (name is from mock data in db)
* To tear down `docker-compose down --rmi all`



POSTGRES SCHEMA (ERD):

![Image of ERD](https://github.com/flash548/epr_tracker/blob/master/users.png)
