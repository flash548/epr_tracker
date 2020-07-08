const express = require('express')
const bodyParser = require('body-parser')
const db = require('./queries')
const process = require('process')
const app = express()
const port = (process.env.NODE_ENV === 'production') ? Number(process.env.PORT_BACK) : 3000

let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
}
app.use(allowCrossDomain);

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/user', db.getUserId)
app.get('/formsData', db.getFormsData)
app.get('/getRecord', db.getRecordData)
app.post('/addUser', db.addUser)
app.post('/deleteUser', db.deleteUser)
app.post('/updateUserForms', db.updateUserForms)
app.post('/updateUserRater', db.updateUserRater)
app.post('/updateUserData', db.updateUserData)

app.listen(port, () => {
    console.log(`sql-exercise running on port ${port}.`)
  })

