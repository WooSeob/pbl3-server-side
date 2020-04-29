var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo');

//라우터
var classRouter = require('./routes/class');
var authRouter = require('./routes/auth');
var userRouter = require('./routes/user');

var app = new express();

//CORS setting
const cors = require('cors');
app.use(cors());

app.use('/css', express.static('./static/css'));
app.use('/js', express.static('./static/js'));

const cookieStore = mongoStore(session);

//--------------------------------- 메인로직 -----------------------------

// DB 연결
mongoose.connect('mongodb://localhost:27017/test',{
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
  console.log("Connection to mongoDB");
});

//미들웨어설정
app.use(session({
    secret: '123has!df2t31has@dfh',
    resave: false,
    saveUninitialized: true,
    store: new cookieStore({ mongooseConnection: mongoose.connection})
}));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

//라우팅 분리
app.use('/class', classRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);

//테스팅
<<<<<<< HEAD
// test.increasePoint('5e940910ecc5c844f02c2fda', 4000);
=======
//var test = require('./test');
//test.increasePoint('5e940910ecc5c844f02c2fda', 4000);
//test.delete();
>>>>>>> 323093a9623c71f1ac64d7c184d512944d3ba5e6

app.get('/', function(req, res){
    res.send('<h1>Hello home page</h1>');
});

app.listen(3000, function(){
    console.log('Connected 3000 port!');
});

