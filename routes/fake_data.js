const express = require('express')
const router = express.Router()
const mysql = require('mysql')

var pool  = mysql.createPool({
  connectionLimit : 2,
  host            : process.env.DB_HOST,
  user            : process.env.DB_USER,
  password        :  process.env.DB_PASS,
  database: process.env.MYSQL_DATABASE,
})

router.get('/', (req, res) => {
  function clear(){
    pool.query(`TRUNCATE TABLE buy`, (err,results) => {
      if (err) throw err;
    })
  }
  let value = [];
  async function add() {
    await clear()
    for (let i=0;i<500;i++){
      let data = [Math.floor(Math.random()*5)+1,parseInt(Math.random() * (1000 - 100) + 100)]
      value.push(data)
    }
    pool.query(`INSERT INTO buy (user_id, total) VALUES ?`,[value], (err,results) => {
      if (err) throw err;
      res.send('done');
    })
  }
  add()
})
module.exports = router;