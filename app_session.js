var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');

var app = express();
app.use(session({
    secret: 'a7asd8fas7d7fasdfs7d7f891',
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/count', function(req, res){
    if(req.session.count){
        req.session.count++;
    }else{
        req.session.count = 1;
    }
    
    res.send('count: ' + req.session.count);
});

app.get('/tmp', function(req, res){
    res.send('result : ' + req.session.count);
});

app.get('/auth/login', function(req, res){
    var output = `
    <h1>Login</h1>
    <form action="/auth/login" method="post">
        <p>
            <input type="text" name="username" placeholder="username">
        </p>
        <p>
            <input type="password" name="password" placeholder="password">
        </p>
        <p>
            <input type="submit">
        </p>
    </form>
    `;
    res.send(output);
});
app.get('/welcome', function(req, res){
    if(req.session.displayName){
        res.send(`
            <h1>Hello, ${req.session.displayName}</h1>
            <a href="/auth/logout">Logout</a>
        `);
    }else{
        res.send(`
            <h1>Welcome</h1>
            <a href="/auth/login">Login</a>
        `);
    }
})
app.get('/auth/logout', function(req, res){
    delete req.session.displayName;
    res.redirect('/welcome');
    
});
app.post('/auth/login', function(req, res){
    // 임시 db 회원정보
    var user = {
        username: "wooseob",
        password: "1234",
        displayName: "우섭"
    };
    
    //전달받은 id, pw
    var uname = req.body.username;
    var pwd = req.body.password;

    // id,pw 검증
    if(uname === user.username && pwd === user.password){
        req.session.displayName = user.displayName;
        res.redirect('/welcome');
    }else{
        res.send('who are you <a href="/auth/login">login</a>');
    }
})


app.listen(3003, function(){
    console.log('Connected 3003 port!');
});

