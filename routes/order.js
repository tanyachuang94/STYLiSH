const express = require('express')
const router = express.Router()
const mysql = require('mysql')
const fetch = require('node-fetch');
var _ = require('lodash');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.MYSQL_DATABASE,
})

router.get('/payments', async(req, res) => {
    let content = {}
    content.data = []
    db.query(`SELECT * FROM buy`,(err,result) => {
        if (err) throw err;
        var results =_.chain(result)
        .groupBy('user_id')
        .map(group => ({
            user_id: _.head(group).user_id,
            total_payment: _.map(group, o => _.pick(o, 'total'))
          }))
        .value()
       const count = 0
        for (let i=0;i<5;i++){
            const array1 = results[i].total_payment
            const reducer = (accumulator, currentValue) => accumulator + currentValue.total;
            content.data.push({
                user_id: i+1,
                total_payment:array1.reduce(reducer, 0)
            })
        }
        res.send(content);
      })
})

router.post('/checkout', (req, res) => {
    let data= req.body
    let body = {
        "prime": data.prime,
        "partner_key": 'partner_PHgswvYEk4QY6oy3n8X3CwiQCVQmv91ZcFoD5VrkGFXo8N7BFiLUxzeG',
        "merchant_id": "AppWorksSchool_CTBC",
        "details":"TapPay Test",
        "amount": data.order.total,
        "cardholder": {
            "phone_number": "+886923456789",
            "name": "Jane Doe",
            "email": "Jane@Doe.com",
            "zip_code": "12345",
            "address": "123 1st Avenue, City, Country",
            "national_id": "A123456789"
        },
        "remember": true
      }
      console.log(body)
    fetch('https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime',{
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json', 'x-api-key': 'partner_PHgswvYEk4QY6oy3n8X3CwiQCVQmv91ZcFoD5VrkGFXo8N7BFiLUxzeG'},
        method: 'POST'
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(res) {
        console.log(res)
        if (res.status == 0){
            let post = {
                user : data.order.recipient.name,
                prime : data.prime,
                details : JSON.stringify(data.order),
                status : 0
            };
            let sql = 'INSERT INTO buy SET ?';
            db.query(sql, post, (err,result) => {
                if (err) throw err;
            })
        } else {
            res.send({ error: res.msg });
        }
    })
})

module.exports = router;