const express = require('express')
const mysql = require('mysql')
const router = express.Router();
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const fetch = require("node-fetch");
const cookieParser = require('cookie-parser');
router.use(cookieParser());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.MYSQL_DATABASE,
})

db.connect((err) => {
    if(err){
        throw err
    };
    console.log('Mysql connected.')
})

router.post('/signup',(req, res) => {
    const email = req.body.email
    const name = req.body.name
    const provider = 'native'
    const picture = 'https://schoolvoyage.ga/images/123498.png'
    let password =req.body.password
    let token = req.body.email + Date()
    let expired = 3600
    function hashData (data) { //加密
        const hash = crypto.createHash('sha256');
        hash.update(data);
        hashResult=hash.digest('hex');
        return(hashResult)
    }
    let hashPW = hashData (password)
    let hashToken = hashData (token)
    function find(email){
        return new Promise(resolve => {
        let sql = `SELECT * FROM user WHERE email = '${email}'`;
        db.query(sql, (err,result) => {
            if (err) throw err
            resolve(result)
        })
        })
    }
    async function insert() {
        let result = await find(email);  
        if (result.length != 0 ){
            const err = new Error()
            err.status = 403
            err.error = 'same email exists.'
            res.send(err)}
        else {
            return new Promise(resolve => {
                let post = {email: email, password: hashPW, name: name, provider: provider, picture: picture, access_token: hashToken, access_expired: expired}
                db.query('INSERT INTO user SET ?', post, (err,result) => {
                if (err) throw err
                resolve (result.insertId)
                })
            });
        }
    }
    insert().then( newid => {
        if (newid != undefined ){
            let content ={}
            let sql = `SELECT * FROM user WHERE id = '${newid}'`;
            db.query(sql, (err,result) => {
                if (err) throw err
                content = { data: { access_token: result[0].access_token , access_expired: result[0].access_expired ,  
                    user: { id:result[0].id , provider: result[0].provider, name:result[0].name, email:result[0].email, picture:result[0].picture}}
                    }
                res.cookie('access_token', result[0].access_token);
                res.send(content)
            })
        }
    })
})

router.post('/signin',(req, res) => {
    const provider = req.body.provider
    function hashData (data) { 
        const hash = crypto.createHash('sha256');
        hash.update(data);
        hashResult=hash.digest('hex');
    return(hashResult)
    }
    function find(email){
        return new Promise(resolve => {
        let sql = `SELECT * FROM user WHERE email = '${email}'`;
        db.query(sql, (err,result) => {
            if (err) throw err
            resolve(result);
        })
        })
    }
    if (provider == 'facebook'){
        function func() {
            let url = 'https://graph.facebook.com/me?fields=id,name,email,picture';
            return new Promise(resolve => {
                fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({access_token: req.body.access_token,})
                }).then(res => {
                    return res.json()
                })
                .then(jsonUser => {
                    resolve(jsonUser)
                })
            })
        }
        func().then(user => {
        async function login() {
            let result = await find(user.email); 
            let hashToken = hashData (user.email + Date())
            let expired = 3600
            if (result.length != 0 ){     
                db.query(`UPDATE user SET access_token = '${hashToken}' WHERE id = '${result[0].id}'`)
                let content ={}
                content = { data: { access_token: hashToken , access_expired: result[0].access_expired ,  
                    user: { id:result[0].id , provider: result[0].provider, name:result[0].name, email:result[0].email, picture:result[0].picture}}
                    }
                res.send(content)
            }else {
                return new Promise(resolve => {
                    let post = {email: user.email, name: user.name, provider: provider, picture: user.picture.data.url, access_token: hashToken, access_expired: expired}
                    db.query('INSERT INTO user SET ?', post, (err,result) => {
                    if (err) throw err
                    resolve (result.insertId)
                    })
                })
                .then( newid => {
                    if (newid != undefined ){
                        let content ={}
                        let sql = `SELECT * FROM user WHERE id = '${newid}'`;
                        db.query(sql, (err,result) => {
                            if (err) throw err
                            content = { data: { access_token: result[0].access_token , access_expired: result[0].access_expired ,  
                                user: { id:result[0].id , provider: result[0].provider, name:result[0].name, email:result[0].email, picture:result[0].picture}}
                                }
                            res.send(content)
                        })
                    }
                })
            }
        }
        login(user)
        })
    }
    else {
        const password =req.body.password
        let hashPW = hashData (password)
        const email = req.body.email
        async function login() {
            let result = await find(email);  
            let hashToken = hashData (result[0].email + Date())
            if (result[0].password == hashPW){
                db.query(`UPDATE user SET access_token = '${hashToken}' WHERE id = '${result[0].id}'`)
                let content ={}
                content = { data: { access_token: hashToken , access_expired: result[0].access_expired ,  
                    user: { id:result[0].id , provider: result[0].provider, name:result[0].name, email:result[0].email, picture:result[0].picture}}
                    }
                res.cookie('access_token', hashToken);
                res.send(content)
            }
            else {
                const err = new Error()
                err.status = 403
                err.error = 'sign in fail.'
                res.send(err)
            }
        }
        login()
    } 
})

router.get('/profile',(req, res) => {
    // if (req.header('authorization') != undefined){
    // const access_token = req.header('authorization').substr(7)
    const access_token = req.cookies.access_token
    if (access_token != undefined){
    function find(access_token){
        return new Promise(resolve => {
            let sql = `SELECT * FROM user WHERE access_token = '${access_token}'`;
            db.query(sql, (err,result) => {
                if (err) throw err
                resolve(result)
            })
        })
    }
    async function profile() {
        let result = await find(access_token); 
        if (result!= undefined){
            let content ={}
            content = { data: { id:result[0].id , provider: result[0].provider, name:result[0].name, email:result[0].email, picture:result[0].picture }}
            res.send(JSON.stringify(content))
        } 
        else {
            const err = new Error()
            err.status = 403
            err.error = 'Invalid Access Token'
            res.send(err)
        }
    }
    profile()
    }
    else {
        res.send(JSON.stringify('/signup.html'))
    }
})

module.exports = router;