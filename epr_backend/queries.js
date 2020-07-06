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

// UTILITY FUNCTION
// GET: get a user's user_id so we can use all these other functions... based on their username or first/last name
//  can be: /users[?username=<username>|lastname=<lastname>|firstname=<firstname>]
const getUsers = (request, response) => {

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

// UTILITY FUNCTION
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

// UTILITY FUNCTION
// POST: add an airman as a user and populate their initial EPR/ACA data/dates
//  body format: {
//      firstname: 
//      lastname:
//      username: 
//      rank:
//      supervisor_id:
//      epr_last_done: DD MON-ABBREV YYYY
//      aca_last_done: DD MON-ABBREV YYYY
// }
//
// --> Returns the newly assigned user_id


// UTILITY FUNCTION
// POST: update an airman's EPR/ACA table entry
//  body format: {
//      user_id,
//      any of <epr_last_done>, <epr_next_due>, <aca_last_done>, <aca_next_due>: <new_date in DD MON-ABBREV YYYY>
//}



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
    getUsers,
    getFormsData,
    getRecordData,
};