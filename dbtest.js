
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo');

var Class = require('./Schemas/Class');
var User = require('./Schemas/User');
var QnA = require('./Schemas/QnA');
var LectureNote = require('./Schemas/LectureNote');
var Participation = require('./Schemas/Participation');

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

app.use(session({
    secret: '123has!df2t31has@dfh',
    resave: false,
    saveUninitialized: true,
    store: new cookieStore({ mongooseConnection: mongoose.connection})
}));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

//수업 정보 받아오기
app.get('/class/:name', function(req, res){
    let targetClassName = req.params.name;
    let query = {
        className: targetClassName
    };
    if(targetClassName == 'all'){query = null;}
    Class.find(query)
    .then((data)=>{
        res.send(data);
    })
    .catch((err)=>{
        console.log(err);
    })
});

//['RealtimeOnlineCourseType', 'OnlineCourseType', 'QnAType', 'OfflineType']
const RealtimeOnlineCourseType = {

}

//수업 참여하기
app.get('/class/:name/join', function(req, res){
    let targetClassName = req.params.name;
    
    let userObjID;
    User.findOne({username: req.session.username}, async (err, user)=>{
        userObjID = await user._id;

        Class.findOne({className: targetClassName}, (err, targetClass)=>{
            let joinAllowed = true;

            // user가 해당 강의 튜터인 경우
            if(String(userObjID) == String(targetClass.tutor)){
                console.log('요청하는사람이 이미 튜터임')
                joinAllowed = false;
            }

            // user가 이미 해당 강의 튜티인 경우
            for(let tuteeID of targetClass.tutees){
                if(String(userObjID) == String(tuteeID)){
                    console.log('이미 수강중입니다.')
                    joinAllowed = false;
                }
            }
            
            if(joinAllowed){
                //아직 수강하지 않은경우 -> 수강할 수 있음
                console.log('수강신청완료')

                targetClass.tutees.push(userObjID);
                targetClass.save();

                user.classesAsTutee.push(targetClass._id);
                user.save();

                res.redirect('/');
            }else{
                //이미 수강중인경우 || 내가 그 강의의 튜터인 경우
                console.log('수강신청에 실패했습니다.')
                return;
            }
        });
    })
});

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

// TODO 비밀번호 암호화 할것
// 로그인
app.post('/auth/login', function(req, res){
    var uname = req.body.username;
    var pwd = req.body.password;
    User.findOne({username: uname}, (err, user)=>{
        if(err || user == null){
            console.log('존재하지않는 아이디');
            res.send('fail');
            return;
        }
        console.log(user);
        if(pwd == user.password){
            //로그인 성공
            req.session.username = user.username;
            req.session.save(()=>{
                console.log(req.session);
                console.log('로그인 성공.');
                res.send('success')
            })
        }else{
            res.send('fail');
        }
    })
})

//로그아웃
app.get('/auth/logout', function(req, res){
    delete req.session.username;
    req.session.save(()=>{
        console.log(req.session);
        console.log('로그아웃 됬습니다.');
        res.redirect('/')
    })
})

//로그인정보 받아오기
app.get('/auth/isAuthenticated', function(req, res){
    //로그인정보 받아오기
    //로그인 되있으면 유저정보 응답
    //로그인 안되있으면 'fail' 응답
    if(req.session.username){
        User.findOne({username: req.session.username}, (err, user)=>{
            if(err){
                console.log(req.session.username + '에 해당하는 유저를 찾을 수 없습니다.');
            }
            res.send(user.toJSON());
        });
    }else{
        res.send('fail');
    }
})

//회원가입
app.post('/register', function(req, res){
    User.create({
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.nickname,
        webmail: req.body.webmail,
        point: 1000,
        classesAsTutee: [],
        classesAsTutor: []
    });
    res.send('Create Successfully');
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

//유저 정보보기
app.get('/user/:id', function(req, res){
    var id = req.params.id;
    User.find({username: id},(err,data)=>{
        console.log(data);
        res.send(data)
    });
});

//모든 유저보기
app.get('/all/user', function(req, res){
    User.find({})
    .then((data)=>{
        res.send(data);
        console.log(data);
    })
    .catch((err)=>{
        console.log(err);
    })
});


app.get('/', function(req, res){
    res.send('<h1>Hello home page</h1>');
});

app.listen(3000, function(){
    console.log('Connected 3000 port!');
});