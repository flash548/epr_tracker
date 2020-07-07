const Pool = require('pg').Pool
const pool = new Pool({
  user: 'chris',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5432,
})

// helper function: returns a string sentence-cased (first letter captialized)
function sc(s) { return s[0].toUpperCase() + s.slice(1); }

// GET: get a user's user_id so we can use all these other functions... based on their username or first/last name
//  can be: /users[?username=<username>|lastname=<lastname>|firstname=<firstname>]
const getUserId = (request, response) => {

    // search by fname/lname
    if (request.query.lastname && request.query.firstname) {
        pool.query('SELECT user_id FROM users WHERE lname = $1 and fname = $2',
            [sc(request.query.lastname), sc(request.query.firstname)], (error, results) => {
            if (error) {
                response.status(500).send("Error fetching DB results")
            }

            if (results.rows[0]) response.status(200).json(results.rows[0])
            else response.status(500).send('Person not found!')
            })
    }

    // search by username
    else if (request.query.username) {
        pool.query('SELECT user_id FROM users WHERE username = $1', [request.query.username.toLowerCase()], (error, results) => {
            if (error) {
                response.status(500).send("Error fetching DB results")
            }

            if (results.rows[0]) response.status(200).json(results.rows[0])
            else response.status(500).send('Person not found!')
        })
    }

    // return error
    else {
        response.status(500).send("Error fetching DB results")
    }
}

// GET: get a single airman's EPR/ACA record (or all if no params provided)
//  can be: /formsData[?username=<username>|lastname=<lastname>|firstname=<firstname>]
const getFormsData = (request, response) => {
    if (request.query.lastname && request.query.firstname) {
        pool.query('SELECT users.fname, users.lname, forms.epr_last_done,' +
                    'forms.epr_next_due,forms.aca_last_done,forms.aca_next_due ' + 
                    'FROM users inner join forms on (users.user_id = forms.user_id) '+
                    'WHERE users.lname = $1 and users.fname = $2',
            [sc(request.query.lastname), sc(request.query.firstname)], (error, results) => {
            if (error) {
                response.status(500).send("Error fetching DB results")
            }

            response.status(200).json(results.rows)
            })
    }
    else if (request.query.username) {
        pool.query('SELECT users.fname, users.lname, forms.epr_last_done,' +
                'forms.epr_next_due,forms.aca_last_done,forms.aca_next_due ' + 
                'FROM users inner join forms on (users.user_id = forms.user_id) '+
                'WHERE users.username = $1', [request.query.username.toLowerCase()], (error, results) => {
            if (error) {
                response.status(500).send("Error fetching DB results")
            }
            response.status(200).json(results.rows)
        })
    }
    else {
        // dump all epr data
        pool.query('SELECT users.fname, users.lname, forms.epr_last_done,' +
            'forms.epr_next_due,forms.aca_last_done,forms.aca_next_due ' + 
            'FROM users inner join forms on (users.user_id = forms.user_id) ', (error, results) => {
            if (error) {
                response.status(500).send("Error fetching DB results")
            }
            response.status(200).json(results.rows)
            })
    }
}

// POST: add an airman as a user and populate their initial EPR/ACA data/dates
//  body format: {
//      first_name: 
//      middle_initial:
//      last_name:
//      user_name: 
//      rank:
//      supervisor_id:
//      epr_last_done: DD MON-ABBREV YYYY
//      epr_next_due: DD MON-ABBREV YYYY
//      aca_last_done: DD MON-ABBREV YYYY
//      aca_next_due: DD MON-ABBREV YYYY
// }
//
// --> Returns the newly assigned user_id
const addUser = async (request, response) => {

    if (request.body.first_name && request.body.middle_initial && request.body.last_name &&
             request.body.user_name && request.body.rank && request.body.supervisor_id && request.body.epr_last_done &&
             request.body.aca_last_done && request.body.epr_next_due && request.body.aca_next_due) {
            
            try {
                // first validate the supervisor ID exists... 
                let superExists = await pool.query(`
                    SELECT fname, lname from users WHERE user_id = $1`, [request.body.supervisor_id])

                if (!superExists.rows[0]) {
                    response.status(500).send("Invalid supervisor ID!")
                    return;
                }

                // verify that the username is not taken already
                let usernameExists = await pool.query(`
                    SELECT username from users WHERE username = $1`, [request.body.user_name])

                if (superExists.rows[0]) {
                    response.status(500).send("Username already taken!")
                    return;
                }


                // now add the user into the users table
                let addResp = await pool.query(`
                    INSERT INTO 
                        users (fname,mi,lname,username,rank) 
                    VALUES ($1,$2,$3,$4,$5) RETURNING user_id`, 
                    [sc(request.body.first_name),sc(request.body.middle_initial),sc(request.body.last_name),request.body.user_name.toLowerCase(),request.body.rank]);

                // no point in continuing if failed to add user
                if (!addResp.rows[0].user_id) {
                    response.status(500).send("Error adding user: User Not Added!")
                    return;
                }

                // add the supervisor info for this new user_id
                let supervisor_response = await pool.query(`
                    INSERT INTO
                        rater_matrix (user_id, supervisor_id)
                    VALUES
                        ($1, $2) RETURNING id`, [addResp.rows[0].user_id, request.body.supervisor_id])

                // no point in continuing if failed here
                if (!supervisor_response.rows[0].id) {
                    response.status(500).send("Error adding supervisor info!")
                    return;
                }

                // add the EPR/ACA info
                let epr_response = await pool.query(`
                    INSERT INTO
                        forms (user_id, epr_last_done, epr_next_due, aca_last_done, aca_next_due)
                    VALUES
                        (
                            $1,
                            to_timestamp($2, 'DD Mon YYYY'),
                            to_timestamp($3, 'DD Mon YYYY'),
                            to_timestamp($4, 'DD Mon YYYY'),
                            to_timestamp($5, 'DD Mon YYYY') 
                        ) RETURNING id`, 
                        [addResp.rows[0].user_id, request.body.epr_last_done, request.body.epr_next_due, request.body.aca_last_done, request.body.aca_next_due])

                if (!epr_response.rows[0].id) {
                    response.status(500).send("Error adding EPR data!")
                    return;
                }

                response.status(200).json({ user_id: addResp.rows[0].user_id });
            }
            catch (e) {
                console.log(e);
                response.status(500).send("DB Error!")
            }
    }
    else {
        response.status(500).send("Not all fields present in request!")
    }
}

// POST: remove an airman's data complete from the database
//  body format: {
//      user_id
//}
const deleteUser = async (request, response) => {
    let resp = await pool.query("DELETE FROM users WHERE user_id = $1 RETURNING user_id", [request.body.user_id])    
    if (!resp.rows[0]) response.status(500).send("Error deleting user")
    else response.status(200).json({ user_id: resp.rows[0].user_id });
}

// POST: update an airman's EPR/ACA table entry
//  body format: {
//      user_id,
//      any of <epr_last_done>, <epr_next_due>, <aca_last_done>, <aca_next_due>: <new_date in DD MON-ABBREV YYYY>
//}
const updateUserForms = async (request, response) => {

    if (! (request.body.user_id)) {
        response.status(500).send("No User ID Specified!")
        return;
    }

    try {
        for (let fieldname in request.body) {
            if (fieldname == 'user_id') continue;
            
            switch (fieldname) {
                case 'epr_last_done':
                    {
                        let resp = await pool.query("UPDATE forms SET epr_last_done = to_timestamp($1, 'DD Mon YYYY') WHERE user_id = $2 RETURNING user_id", [request.body[fieldname], request.body.user_id])
                        if (!resp.rows[0]) {
                            response.status(500).send("Error updating EPR_LAST_DONE record!")
                            return;
                        }                     
                    }
                    break;
                case 'epr_next_due':
                    {
                        let resp = await pool.query("UPDATE forms SET epr_next_due = to_timestamp($1, 'DD Mon YYYY') WHERE user_id = $2 RETURNING user_id", [request.body[fieldname], request.body.user_id])
                        if (!resp.rows[0]) {
                            response.status(500).send("Error updating EPR_NEXT_DUE record!")
                            return;
                        }                     
                    }
                    break;
                case 'aca_last_done':
                    {
                        let resp = await pool.query("UPDATE forms SET aca_last_done = to_timestamp($1, 'DD Mon YYYY') WHERE user_id = $2 RETURNING user_id", [request.body[fieldname], request.body.user_id])
                        if (!resp.rows[0]) {
                            response.status(500).send("Error updating ACA_LAST_DONE record!")
                            return;
                        }                     
                    }
                    break;
                case 'aca_next_due':
                    {
                        let resp = await pool.query("UPDATE forms SET aca_next_due = to_timestamp($1, 'DD Mon YYYY') WHERE user_id = $2 RETURNING user_id", [request.body[fieldname], request.body.user_id])
                        if (!resp.rows[0]) {
                            response.status(500).send("Error updating ACA_NEXT_DUE record!")
                            return;
                        }                     
                    }
                    break;
                default:
                    response.status(500).send("Invalid field name specified!");
                    return;
                }                
        }
        response.status(200).json({user_id: request.body.user_id} );
    }
    catch (e) {
        console.log(e)
        response.status(500).send("Error updating database!")
    }

}

// POST: update an airman's personnel data
//  body format: {
//      user_id,
//      any of <fname> <lname> <rank>
//}
const updateUserData = async (request, response) => {

    if (! (request.body.user_id)) {
        response.status(500).send("No User ID Specified!")
        return;
    }

    try {
        for (let fieldname in request.body) {
            if (fieldname == 'user_id') continue;
            
            switch (fieldname) {
                case 'fname':
                    {
                        let resp = await pool.query("UPDATE users SET fname = $1 WHERE user_id = $2 RETURNING user_id", [request.body[fieldname], request.body.user_id])
                        if (!resp.rows[0]) {
                            response.status(500).send("Error updating FIRST NAME record!")
                            return;
                        }                     
                    }
                    break;
                case 'mi':
                    {
                        let resp = await pool.query("UPDATE users SET mi = $1 WHERE user_id = $2 RETURNING user_id", [request.body[fieldname], request.body.user_id])
                        if (!resp.rows[0]) {
                            response.status(500).send("Error updating MIDDLE INITIAL record!")
                            return;
                        }                     
                    }
                    break;                    
                case 'lname':
                    {
                        let resp = await pool.query("UPDATE users SET lname = $1 WHERE user_id = $2 RETURNING user_id", [request.body[fieldname], request.body.user_id])
                        if (!resp.rows[0]) {
                            response.status(500).send("Error updating LAST NAME record!")
                            return;
                        }                     
                    }
                    break;
                case 'rank':
                    {
                        let resp = await pool.query("UPDATE forms SET rank = $1 WHERE user_id = $2 RETURNING user_id", [request.body[fieldname], request.body.user_id])
                        if (!resp.rows[0]) {
                            response.status(500).send("Error updating RANK record!")
                            return;
                        }                     
                    }
                    break;               
                default:
                    response.status(500).send("Invalid field name specified!");
                    return;
                }                
        }
        response.status(200).json({user_id: request.body.user_id});
    }
    catch (e) {
        console.log(e)
        response.status(500).send("Error updating database!")
    }

}

// POST: update an airman's rater
//  body format: {
//      user_id,
//      rater_id
//}
const updateUserRater = async (request, response) => {
    if (! (request.body.user_id && request.body.supervisor_id)) {
        response.status(500).send("Invalid fields specified!")
        return;
    }

    let resp = await pool.query("UPDATE rater_matrix SET supervisor_id = $1 WHERE user_id = $2 RETURNING user_id", [request.body.supervisor_id, request.body.user_id])    
    if (!resp.rows[0]) response.status(500).send("Error updating user")
    else response.status(200).json({user_id: resp.rows[0].user_id} );
}



// GET: get a single airman's EPR/ACA record AND the name of their rater and any airmen they rate
//  can be: /getRecord?userid=[userid]
// Returns a data structure of the following format:
// {
//      raterInfo: { rater information }
//      subordinates: {
//          data: { current user's data }
//          reports: [ { people rated by this user } ]
// }
const getRecordData = async (request, response) => {

        // request must have a username -- or last.first combo provided
        if (!request.query.userid) {
            response.status(500).send("Invalid or insufficient data provided");
        }

        // use username
        if (request.query.userid) {
            try {
                let retVal = {}; // json obj we'll return

                // get rater name/info, but not their EPR/ACA info
                let raterData = await pool.query(`SELECT 
                        users.rank, users.fname, users.mi, users.lname
                    FROM 
                        users 
                    WHERE 
                        user_id = (SELECT supervisor_id FROM rater_matrix WHERE user_id = $1)`, [request.query.userid]);

                async function inner(userid) {
                    // get subordinate(s) name/info
                    let subordinates = { data: {}, reports: []};
                    let subordinateData = await pool.query(`SELECT 
                            users.user_id,
                            users.username,
                            users.fname, 
                            users.mi,
                            users.lname, 
                            users.rank,
                            forms.epr_last_done,
                            forms.epr_next_due,
                            forms.aca_last_done,
                            forms.aca_next_due 
                        FROM users INNER JOIN forms on (users.user_id = forms.user_id) 
                        WHERE forms.user_id = $1`, [userid]);
                        
                        for (let record of subordinateData.rows) {
                            
                            // see if this subordinate is also a supervisor
                            let superVisorQuery = await pool.query(`SELECT
                                rater_matrix.user_id, users.username FROM rater_matrix INNER JOIN users on (users.user_id = rater_matrix.user_id)
                                WHERE rater_matrix.supervisor_id = $1`, [record.user_id]);

                            let data = [];
                            for (let person of superVisorQuery.rows) {                                
                                let entry = await inner(person.user_id);
                                console.log(entry);
                                data.push(entry);
                            }                                                        
                            
                            subordinates.data = record
                            subordinates.reports = data;
                        }

                        return subordinates;
                }

                // see if rater info ois there/valid
                if (raterData.rows[0]) { retVal['raterInfo'] = raterData.rows[0]; }
                else { retVal['raterInfo'] = "Unknown"; }

                // list the current user and their EPR data and then any nested subordinates...
                retVal['subordinates'] = await inner(request.query.userid);
                
                response.status(200).json(retVal);
            }
            catch (e) { console.log(e); response.status(500).send("Database Error!")}
        }
        else {
            response.status(500).send("Database Error!")
        }
}

module.exports = {
    getUserId,
    getFormsData,
    addUser,
    deleteUser,
    updateUserForms,
    updateUserRater,
    updateUserData,
    getRecordData,
};