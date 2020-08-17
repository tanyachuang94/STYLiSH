require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const multer  = require('multer')
const mysql = require('mysql')
const hostip = 'localhost'
const port = 3000
const app = express()

app.use(express.static('public'))
app.use(express.static('uploads'))
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.MYSQL_DATABASE,
});

db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('Mysql connected.')
})

const userRoutes = require('./routes/user')
app.use('/api/1.0/user', userRoutes)

const orderRoutes = require('./routes/order');
app.use('/api/1.0/order', orderRoutes);

// app.get('/', (req, res) => {
//     res.render('signup')
// })
const fakedataRoutes = require('./routes/fake_data');
app.use('/api/1.0/fake_data', fakedataRoutes);

const productsRoutes = require('./routes/products')
app.use('/api/1.0/products', productsRoutes)

app.get('/admin/product', (req, res) => {
    res.render('product')
})

const marketingRoutes = require('./routes/marketing')
app.use('/api/1.0/marketing', marketingRoutes)

app.get('/admin/campaign', (req, res) => {
    res.render('campaign')
})

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, 'uploads')
    },
    filename: function (req, file, callback) {
        callback(null, Date.now()+ '_' + file.originalname )
        }
  })
const upload = multer({storage: storage})

var cpUpload = upload.fields([{ name: 'main_image', maxCount: 1 }, { name: 'images', maxCount: 5 }])
app.post('/admin/product', cpUpload, function (req, res, next) {
    let data= req.files['images'];

    if (data !=undefined){
        for(let i=0;i<data.length;i++){
            data[i] = `http://${hostip}/${req.files['images'][i].filename}`;
        }
    };
    
    let post = {
        title: req.body.title, 
        description: req.body.description, 
        category: req.body.category, 
        price: req.body.price, 
        texture: req.body.texture, 
        wash: req.body.wash, 
        place: req.body.place, 
        note: req.body.note, 
        story: req.body.story,
        main_image: `http://${hostip}/${req.files['main_image'][0].filename}`,
        images: data.join() // 陣列轉自串才能存入mysql
    };
  
    let color = req.body.color.split(",");
    let size = req.body.size.split(",");
    let variants = req.body.stock.split(",");
    function create_product(post) {
        return new Promise(resolve => {
            let sql = 'INSERT INTO product SET ?';
            let query = db.query(sql, post, (err,result) => {
                if (err) throw err;
                resolve(result.insertId);
            });
        });
      }
    async function f1(post) {
        let product_id = await create_product(post);
        const color_id = new Promise(resolve =>  {
            db.query(`SELECT id FROM color WHERE hex_code in (?)`, [color], (err, result) => {
                if (err) throw err;
                resolve(result);
            }); 
        }); 
        const size_id = new Promise(resolve =>  {
            db.query(`SELECT id FROM size WHERE item in (?)`, [size], (err, result) => {
                if (err) throw err;
                resolve(result);
            });
        }); 
        Promise.all([color_id, size_id]).then(values => { 
            let count = -1;
            for(let i=0;i<values[0].length;i++){
                for(let j=0;j<values[1].length;j++){
                    count ++;
                db.query(`INSERT INTO stylish.variants SET product_id='${product_id}', color_id='${values[0][i].id}', size_id='${values[1][j].id}', stock='${variants[count]}'`, (err,result) => {
                    if (err) throw err;
                });
                }
            }
        });
        res.send();
    };
    f1(post);
});

app.post('/admin/campaigns', upload.single('picture'), function (req, res, next) {
    let post = {
        product_id: req.body.product_id, 
        story: req.body.story,
        picture: req.file.path,
    };
    let sql = 'INSERT INTO campaign SET ?';
    db.query(sql, post, (err,result) => {
        if (err) throw err;
        console.log(result);
        res.send();
    })
});

// app.get('/admin/variants', (req, res) => {
//     let product_id = req.query.id ;
//     console.log(product_id);
//     res.send(render('variants.html',{product_id : product_id}));
// });

app.listen(port, () => {
	console.log(`The server is running on port ${port}!`);
});


