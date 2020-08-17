const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.MYSQL_DATABASE,
});

router.get('/:category', (req, res) => {
    let category = req.params.category;
    let paging = ''
    if (req.query.paging == undefined){paging=0}
    else{paging = Number(req.query.paging)} 
    let start = paging*6;
    let end = (paging+1)*6;
    let limit = String(start+',6');
    let contents ={};
    function query_product() {
        return new Promise(resolve => {
            if (category == 'men' || category == 'women' || category == 'accessories'){
                let query_cat = new Promise(resolve =>  {
                    db.query(`SELECT * FROM product WHERE category = '${category}' Limit ${limit}`, (err, result) => {
                        if (err) throw err;
                        resolve(result);
                    });
                });
                let counts = new Promise(resolve =>  {
                    db.query(`SELECT COUNT(id)as count FROM product WHERE category = '${category}'`, (err, result) => {
                        resolve(result);
                    });
                });
                Promise.all([query_cat, counts]).then(values => { 
                    let count = Number(values[1][0].count);
                    if (count > end && count % 6 >=1){
                        let next_paging = Math.ceil((count - end ) / 6)
                        contents.next_paging = next_paging;
                    };
                });
                resolve(query_cat);
            } else if (category == 'search'){
                let keyword = req.query.keyword
                    db.query(`SELECT * FROM product WHERE title like '%${keyword}%'`, (err, result) => {
                    resolve(result);
                  });
            } else if (category == 'details'){
                let id = req.query.id
                    db.query(`SELECT * FROM product WHERE id = ${id}`, (err, result) => {
                    resolve(result);
                  });             
            }     
            else {
                let query_cat = new Promise(resolve =>  {
                    db.query(`SELECT * FROM product Limit ${limit}`, (err, result) => {
                        if (err) throw err;
                        resolve(result);
                    });
                });
                let counts = new Promise(resolve =>  {
                    db.query(`SELECT COUNT(id)as count FROM product;`, (err, result) => {
                        resolve(result);
                    });
                });
                Promise.all([query_cat, counts]).then(values => { 
                    let count = Number(values[1][0].count);
                    if (count > end && count % 6 >=1){
                        let next_paging = Math.ceil((count - end ) / 6) //無條件進位取整數
                        contents.next_paging = next_paging;
                    };
                });
            resolve(query_cat);
            };
        });
    };
    async function product() {
        let data = await query_product(); //前面沒有return東西
      
        let product_id = data.map(item => Object.values(item)[0]); //取得第一個[0]的值
        function query_variants(product_id) {
            return new Promise(resolve => {
                if (product_id != ''){
                db.query(`SELECT * FROM variants WHERE product_id in (?)`, [product_id],(err, result) => {
                if (err) throw err;
                resolve(result);
                });
                }
            });
            
        };
        async function datas(product_id) {
            let variants = await query_variants(product_id);
            let colors = new Promise(resolve =>  {
                db.query(`SELECT * FROM color`, (err, result) => {
                    resolve(result);
                });
            });
            let sizes = new Promise(resolve =>  {
                db.query(`SELECT * FROM size`, (err, result) => {
                    resolve(result);
                });
            });
            Promise.all([colors, sizes]).then(values => { 
                let colors = values[0];
                let sizes = values[1];
                for (let i=0;i<data.length;i++) {
                    let pro_color = [];
                    let pro_size = [];
                  
                        data[i].variants = [];
                        for (let j=0;j<variants.length;j++) {
                            if (data[i].id == variants[j].product_id){
                                const findsize = sizes.find(function(item, index, array){ //從variants table裡的id找到對應的size
                                    return item.id ==  variants[j].size_id;          
                                });
                                const findcolor = colors.find(function(item, index, array){ 
                                return item.id ==  variants[j].color_id;          
                                });
                                data[i].variants.push({color_code:findcolor.hex_code,size:findsize.item,stock:variants[j].stock});
                                pro_color.push(variants[j].color_id);
                                pro_size.push(variants[j].size_id);
                            };
                        };
                
                    let images = data[i].images.split(","); //mysql裡的字串轉陣列
                    data[i].images = images
                    let color_id = [...new Set(pro_color)]; //產生unique值的陣列
                    let size_id = [...new Set(pro_size)]; 
                    
                        data[i].sizes = [];	
                        for (let a=0; a<size_id.length; a++){
                            for (let b=0; b<sizes.length; b++){
                                if (size_id[a] == sizes[b].id){
                                    size_id[a] = sizes[b].item
                                     
                                };
                            };
                        };
                        data[i].sizes=size_id; 
                    
                        data[i].colors = [];
                        for (let x=0; x<color_id.length; x++){
                            for (let y=0; y<colors.length; y++){
                                if (color_id[x] == colors[y].id){
                                    data[i].colors.push({code:colors[y].hex_code, name:colors[y].color_name});
                                }
                            };
                        };
                };

                if (data.length == 1){
                    contents = {data:data[0]};
                } else {
                    contents.data = data;
                } 
                res.send(contents);
            });
        };
        datas(product_id);
    };  
    product();
});

module.exports = router;