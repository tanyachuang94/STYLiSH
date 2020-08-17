let getURL = location.href; //用location.href取得網址，並存入變數
let url = new URL(getURL)  //將網址 (字串轉成URL)
let getID = url.searchParams.get('id') //回傳url的id參數
// let orderList = {};

function clickColor(item) {
    let id = item.id
    let focus = document.getElementById(id)
    let focused = document.getElementsByClassName('color current')  // focused is tag object
    if (focused[0]!= undefined){focused[0].classList.remove('current')}
    focus.classList.add('current')
    // orderList.color = focus.id
    // console.log(orderList)
}
function clickSize(item) {
    let id = item.id
    let focus = document.getElementById(id)
    let focused = document.getElementsByClassName('size current')  
    if (focused[0]!= undefined){focused[0].classList.remove('current')}
    focus.classList.add('current')
}

function add(){
    let value = document.getElementsByClassName('value')  
    let oldValue = value[0].innerHTML
    value[0].innerHTML = Number(oldValue) +1 
}

function cut(){
    let value = document.getElementsByClassName('value')  
    let oldValue = value[0].innerHTML
    let newValue = Number(oldValue) -1 
    if (newValue < 1){newValue = 1}
    value[0].innerHTML = newValue
}

function order(){
    let color = document.getElementsByClassName('color current') 
    let size = document.getElementsByClassName('size current') 
    let qty = document.getElementsByClassName('value')[0].innerHTML
    let total = Number(product.price) * Number(qty)
    var data = {prime: '', 
    order: {shipping:'delivery', payment: 'credit_card', subtotal: 1234, freight: 60, total: total,
        recipient: {name: 'Luke', phone: '0987654321', email: 'luke@gmail.com', address: '市政府站', time: 'morning'},
    list: [{id: product.id, name: product.title, price: product.price, color: {code: color[0].id, name: 'xx'}, size: size[0].id, qty:qty}]
    }}
    return data
}

let product = {} 

fetch('/api/1.0/products/details?id=' + getID)
    .then(res =>　res.json()) 
    .then(res => {
        product = res.data
        // const logo = document.getElementsByClassName('logo')[0]  //current category and tag is not implemented yet
        // console.log(logo)
        // let nav = document.createElement('nav')
        // logo.appendChild(nav)
        const divMainImg = document.getElementById('product-main-image')
        const Img = document.createElement('img')
            Img.setAttribute('src', res.data.main_image)
            divMainImg.appendChild(Img)
        const name = document.getElementById('product-name')
            name.innerHTML = res.data.title
        const id = document.getElementById('product-id')
            id.innerHTML = res.data.id
        const price = document.getElementById('product-price')
            price.innerHTML = res.data.price
        const colors = document.getElementById('product-colors')
        for (let j=0; j < res.data.colors.length; j++) {
            let divColor = document.createElement('div')
            divColor.setAttribute('class', 'color')
            divColor.setAttribute('id', res.data.colors[j].code)
            divColor.setAttribute('style', 'background-color:#'+res.data.colors[j].code);
            divColor.setAttribute('onClick', 'clickColor('+ res.data.colors[j].code + ')')
            colors.appendChild(divColor)
        }
        const sizes = document.getElementById('product-sizes')
        for (let i=0; i < res.data.sizes.length; i++) {
            let divSize = document.createElement('div')
            divSize.setAttribute('class', 'size')
            divSize.setAttribute('id', res.data.sizes[i])
            divSize.innerHTML = res.data.sizes[i]
            divSize.setAttribute('onClick', 'clickSize('+ res.data.sizes[i] + ')')
            sizes.appendChild(divSize)
        }
        const summary = document.getElementById('product-summary')
            let content = res.data.note + "<br><br>" + res.data.texture + "<br>" + res.data.description.replace(/\\r\\n/i, '<br/>') + "<br><br>清洗：" + res.data.wash + "<br>產地：" + res.data.place
            // replace cannot work
            summary.innerHTML = content
        const story = document.getElementById('product-story')
            story.innerHTML = res.data.story
        const imgages = document.getElementById('product-images')
        for (let x=0; x < res.data.images.length; x++) {
            const Imgs = document.createElement('img')
            Imgs.setAttribute('src', res.data.images[x])
            imgages.appendChild(Imgs)
        }
    })
  
    
  
