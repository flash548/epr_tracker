DROP TABLE IF EXISTS users, rater_matrix, forms;

CREATE TABLE users (
    user_id serial PRIMARY KEY,
    fname text NOT NULL,
    mi text,
    lname text NOT NULL,
    username text NOT NULL,
    rank text NOT NULL
);

CREATE TABLE rater_matrix (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
    supervisor_id integer NOT NULL REFERENCES users
);

-- NOTE:
-- should be 120-360 days interval
-- should be mid way thru EPR interval
CREATE TABLE forms (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
    epr_last_done timestamp NOT NULL,
    epr_next_due timestamp NOT NULL,  
    aca_last_done timestamp NOT NULL, 
    aca_next_due timestamp NOT NULL 
);

-- add in some sample users
INSERT INTO users (fname,mi,lname,username,rank) VALUES ('Joe','C','Snuffy','snuffyjc','SSgt');
INSERT INTO users (fname,mi,lname,username,rank) VALUES ('Jane','B','Smith','smithjb','SrA');
INSERT INTO users (fname,mi,lname,username,rank) VALUES ('John','Q','Public','publicjq','SSgt');
INSERT INTO users (fname,mi,lname,username,rank) VALUES ('Adam','H','Baker','bakerah','TSgt');
INSERT INTO users (fname,mi,lname,username,rank) VALUES ('George','A','Washington','washingtonga','SrA');
INSERT INTO users (fname,mi,lname,username,rank) VALUES ('Clark','A','Johnson','johnsonca','SrA');
-- populate the rater scheme--
-- SSgt Public rates SrA Smith
INSERT INTO rater_matrix (user_id,supervisor_id) VALUES (
    (SELECT user_id from users WHERE lname = 'Smith'),
    (SELECT user_id from users WHERE lname = 'Public'));
-- SSgt Public rates SrA Washington
INSERT INTO rater_matrix (user_id,supervisor_id) VALUES (
    (SELECT user_id from users WHERE lname = 'Washington'),
    (SELECT user_id from users WHERE lname = 'Public'));
-- SSgt Snuffy rates SrA Johnson
INSERT INTO rater_matrix (user_id,supervisor_id) VALUES (
    (SELECT user_id from users WHERE lname = 'Johnson'),
    (SELECT user_id from users WHERE lname = 'Snuffy'));
-- TSgt Baker rates SSgt Snuffy
INSERT INTO rater_matrix (user_id,supervisor_id) VALUES (
    (SELECT user_id from users WHERE lname = 'Snuffy'),
    (SELECT user_id from users WHERE lname = 'Baker'));
-- TSgt Baker rates SSgt Public
INSERT INTO rater_matrix (user_id,supervisor_id) VALUES (
    (SELECT user_id from users WHERE lname = 'Public'),
    (SELECT user_id from users WHERE lname = 'Baker'));

-- populate the forms info --
-- SSgt Joe Snuffy
-- Last EPR: 20 Jan 2020 , next due +360days
-- Last ACA: 20 Jul 2019, next due +360days
INSERT INTO forms (user_id,epr_last_done,epr_next_due,aca_last_done,aca_next_due) VALUES (
    (SELECT user_id from users where lname = 'Snuffy'),
    to_timestamp('20 JAN 2020', 'DD Mon YYYY'), to_timestamp('20 JAN 2021', 'DD Mon YYYY'),
    to_timestamp('20 JUL 2019', 'DD Mon YYYY'), to_timestamp('20 JUL 2020', 'DD Mon YYYY')
);
-- SrA Jane Smith
-- Last EPR: 31 Mar 2020 , next due +360days
-- Last ACA: 30 Oct 2019, next due +360days
INSERT INTO forms (user_id,epr_last_done,epr_next_due,aca_last_done,aca_next_due) VALUES (
    (SELECT user_id from users where lname = 'Smith'),
    to_timestamp('31 MAR 2020', 'DD Mon YYYY'), to_timestamp('30 MAR 2021', 'DD Mon YYYY'),
    to_timestamp('30 OCT 2019', 'DD Mon YYYY'), to_timestamp('30 OCT 2020', 'DD Mon YYYY')
);
-- SSgt John Public
-- Last EPR: 20 Jan 2020 , next due +360days
-- Last ACA: 20 Jul 2019, next due +360days
INSERT INTO forms (user_id,epr_last_done,epr_next_due,aca_last_done,aca_next_due) VALUES (
    (SELECT user_id from users where lname = 'Public'),
    to_timestamp('20 JAN 2020', 'DD Mon YYYY'), to_timestamp('20 JAN 2021', 'DD Mon YYYY'),
    to_timestamp('20 JUL 2019', 'DD Mon YYYY'), to_timestamp('20 JUL 2020', 'DD Mon YYYY')
);
-- TSgt Adam Baker
-- Last EPR: 30 Nov 2019 , next due +360days
-- Last ACA: 15 May 2020, next due +360days
INSERT INTO forms (user_id,epr_last_done,epr_next_due,aca_last_done,aca_next_due) VALUES (
    (SELECT user_id from users where lname = 'Baker'),
    to_timestamp('30 NOV 2019', 'DD Mon YYYY'), to_timestamp('30 NOV 2020', 'DD Mon YYYY'),
    to_timestamp('15 MAY 2020', 'DD Mon YYYY'), to_timestamp('15 MAY 2021', 'DD Mon YYYY')
);
-- SrA George Washington
-- Last EPR: 31 Mar 2020 , next due +360days
-- Last ACA: 30 Oct 2019, next due +360days
INSERT INTO forms (user_id,epr_last_done,epr_next_due,aca_last_done,aca_next_due) VALUES (
    (SELECT user_id from users where lname = 'Washington'),
    to_timestamp('31 MAR 2020', 'DD Mon YYYY'), to_timestamp('30 MAR 2021', 'DD Mon YYYY'),
    to_timestamp('30 OCT 2019', 'DD Mon YYYY'), to_timestamp('30 OCT 2020', 'DD Mon YYYY')
);
-- SrA Clark Johnson
-- Last EPR: 31 Mar 2020 , next due +360days
-- Last ACA: 30 Oct 2019, next due +360days
INSERT INTO forms (user_id,epr_last_done,epr_next_due,aca_last_done,aca_next_due) VALUES (
    (SELECT user_id from users where lname = 'Johnson'),
    to_timestamp('31 MAR 2020', 'DD Mon YYYY'), to_timestamp('30 MAR 2021', 'DD Mon YYYY'),
    to_timestamp('30 OCT 2019', 'DD Mon YYYY'), to_timestamp('30 OCT 2020', 'DD Mon YYYY')
);

-- see data for all the folks that SSgt John Public rates
SELECT users.fname, 
       users.lname, 
       users.rank,
       forms.epr_last_done,
       forms.epr_next_due,
       forms.aca_last_done,
       forms.aca_next_due from rater_matrix 
    inner join users on (users.user_id = rater_matrix.user_id) 
    inner join forms on (users.user_id = forms.user_id) 
    where rater_matrix.supervisor_id = (SELECT user_id FROM users where username = 'publicjq') 
    