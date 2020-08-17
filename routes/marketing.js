const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.MYSQL_DATABASE,
});

router.get('/campaigns', async (req, res) => {
    const contents ={};
    try{
        const result = await db.query(`SELECT * FROM campaign`, (err, result) => {
            if (err) throw err;
            contents.data = result;
            res.send(contents)
        })
    } catch {
        res.send({error: 'Wrong Request'});
      }
    })

module.exports = router;