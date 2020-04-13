var express = require('express');
var cookieParser = require('cookie-parser');

var app = express();
app.use(cookieParser('123asdf31581'));
// cookieParser(암호화 키)
// 쿠키 파서에 파라미터로 사용한 암호화 키로 클라이언트-서버 간 쿠키를 주고받을때
// 암호화 해서 주고받는다


app.listen(3003, function(){
    console.log('Connected 3003 port!');
})

var products = {
    1:{title: 'The history of web 1'},
    2:{title: 'The next web'}
};

app.get('/products', function(req, res){
    var output = '';
    for(var name in products){
        output += `
        <li>
            <a href="/cart/${name}">${products[name].title}</a>
        </li>`;
    }
    res.send(`
    <h1>Products</h1>
    <ul>
        ${output}
    </ul>
    <a href="/cart">Cart</a>`
    );
})

app.get('/cart/:id', function(req, res){
    var id = req.params.id;
    res.send('hi ' + id);
})



app.get('/count', function(req, res){
    //req.signedCookies : 클라이언트에게 받은 암호화 된 쿠키를 복호화한다.
    if(req.signedCookies.count){
        var count = parseInt(req.cookies.count);
    }else{
        var count = 0;
    }
    
    count = count + 1;
    res.cookie('count', count, {signed: true});
    //signed: true : 리스폰스 쿠키의 데이터를 암호화 해서 보낸다
    res.send('count : ' + count);
})
