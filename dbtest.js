var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo');
//스키마
var Class = require('./Schemas/Class');
var User = require('./Schemas/User');
var QnA = require('./Schemas/QnA');
var LectureNote = require('./Schemas/LectureNote');
var Participation = require('./Schemas/Participation');
//라우터
var classRouter = require('./routes/class');
var authRouter = require('./routes/auth');
var userRouter = require('./routes/user');

var app = express();

const cookieStore = mongoStore(session);

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


//내가 튜터인 클래스들 받아오기
app.post('/myclass/tutor', function(req, res){
    var userid = req.body.userid;
    if(userid == req.session.username){
        User.findOne({username: userid}, async (err, user)=>{
            if(err){
                console.log('해당하는 유저를 찾을 수 없습니다.');
            } 
            //내가 튜터인 강의 리스트 만들기
            let classList = new Array();
            for(let classID of user.classesAsTutor){
                let found = await Class.findById(classID);
                classList.push(found);
            }
            res.send(classList);
        });
    }else{
        res.send('잘못된 접근입니다.');
    }
})

//내가 튜티인 클래스들 받아오기
app.post('/myclass/tutee', function(req, res){
    var userid = req.body.userid;
    if(userid == req.session.username){
        User.findOne({username: userid}, async (err, user)=>{
            if(err){
                console.log('해당하는 유저를 찾을 수 없습니다.');
            }
            //내가 튜티인 강의 리스트 만들기
            let classList = new Array();
            for(let classID of user.classesAsTutee){
                let found = await Class.findById(classID);
                classList.push(found);
            }
            res.send(classList);
        });
    }else{
        res.send('잘못된 접근입니다.');
    }
})

//수업생성
app.post('/newclass', function(req, res){
    //튜터 아이디로 수업 생성
    console.log(req.session);
    User.findOne({username: req.session.username}, (err,tutor)=>{
        if(err){ res.send('fail'); return; }

        var newClass = new Class({
            classType: req.body.classType,
            category: req.body.category,
            studyAbout: req.body.studyAbout,
            className: req.body.className,
            price: req.body.price,
            tutor: tutor._id
        });
        newClass.save();

        //이 강의를 개설한 유저의 classesAsTutor 항목에 이 강의 추가
        tutor.classesAsTutor.push(newClass._id);
        tutor.save();
    });
    res.send('fail')
})

app.get('/', function(req, res){
    res.send('<h1>Hello home page</h1>');
});

app.listen(3000, function(){
    console.log('Connected 3000 port!');
});