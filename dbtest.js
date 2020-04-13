
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo');
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
            if(userObjID == targetClass.tutor){
                joinAllowed = false;
            }

            // user가 이미 해당 강의 튜티인 경우
            for(let tuteeID of targetClass.tutees){
                if(userObjID == tuteeID){
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
                console.log('이미 수강중입니다.')
            }
        });
    })
});


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
app.get('/auth/logout', function(req, res){
    delete req.session.username;
    req.session.save(()=>{
        console.log(req.session);
        console.log('로그아웃 됬습니다.');
        res.redirect('/')
    })
})
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

// CREATE
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
app.post('/join/')

// READ
app.get('/user/:id', function(req, res){
    var id = req.params.id;
    User.find({username: id},(err,data)=>{
        console.log(data);
        res.send(data)
    });
});

//DELETE
app.get('/delete/user/:id', async function(req, res){
    var id = req.params.id;
    const r = await User.remove({ username: id });
    console.log(r.deletedCount); // Number of documents removed
})
app.get('/delete/class/:name', async function(req, res){
    var name = req.params.name;
    const r = await Class.remove({ className: name });
    console.log(r.deletedCount); // Number of documents removed
})

//RETRIEVE
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


// 스키마 만들기
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    nickname: String,
    webmail: String,
    point: Number,
    classesAsTutee: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class"
        }
    ],
    classesAsTutor: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class"
        }
    ],
    //데이터 추가중......
});

const ClassSchema = new mongoose.Schema({
    //튜터 : User
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    //튜티
    tutees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    //강의 타입
    classType: {
        type: String,
        enum: ['RealtimeOnlineCourseType', 'OnlineCourseType', 'QnAType', 'OfflineType']
    },

    //카테고리 ex)컴퓨터공학
    category: {
        type: String,
        enum: ['컴퓨터공학', '수학', '영어']
    },

    //수업 ex)알고리즘
    studyAbout: String,

    //강의명 ex)알고리즘 쉽게 배워봐요~!!
    className: String,
    
    //수강 필요 포인트
    price: Number,

    //강의 생성일
    createdAt: {
        type: Date,
        default: Date.now
    },

    //--------------------------------------------------------------------------
    //성적인증
    grade: String,

    //튜터 하고싶은말
    description: String,

    //수업시간
    lectureTime: {
        startAt: Date,
        duration: Number
    },

    //커리큘럼
    course: [
        {
            type: String
        }
    ],
    
    //강의노트
    lectureNote: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LectureNote"
        }
    ],

    //출결확인
    participation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participation"
    },

    //질의응답
    qna: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QnA"
        }
    ],


    // Not Required
    //스카이프 링크 - 커리큘럼 온라인 실시간
    skypeLink: String,

    //강의 링크 - 커리큘럼 온라인
    course:[
        {
            description: String,
            link: String
        }
    ],

    //실시간 채팅방 - 질의응답형
    chattingRoom: String
});

//컴포넌트별
    //질의응답 게시판

const QnASchema = new mongoose.Schema({
    question: String,
    answer: String
});
    //강의노트 게시판
const LectureNoteSchema = new mongoose.Schema({
    title: String,
    content: String
});
    //출결관리
const ParticipationSchema = new mongoose.Schema({
    
});

const Class = mongoose.model("Class", ClassSchema);
const User = mongoose.model("User", UserSchema);
const QnA = mongoose.model("QnA", QnASchema);
const LectureNote = mongoose.model("LectureNote", LectureNoteSchema);
const Participation = mongoose.model("Participation", ParticipationSchema);

// //테스트 데이터
// var testusers = [
//     {
//         username: 'bws96o',
//         password: 'asdf123',
//         nickname: '우섭',
//         webmail: 'bws96o@hknu.ac.kr',
//         point: 9999990,
//         classesAsTutee: [],
//         classesAsTutor: []
//     },
//     {
//         username: 'minsick',
//         password: '123123',
//         nickname: '민식',
//         webmail: 'minsick@hknu.ac.kr',
//         point: 12333,
//         classesAsTutee: [],
//         classesAsTutor: []
//     },
//     {
//         username: 'gildong',
//         password: 'qwer123',
//         nickname: '길동',
//         webmail: 'gildong@hknu.ac.kr',
//         point: 500,
//         classesAsTutee: [],
//         classesAsTutor: []
//     }
// ]

// User.insertMany(testusers, function(err, doc){
//     if(err){
//         console.log(err);
//     };
// })


// //클래스 타입별
//     //커리큘럼형 온라인 실시간
//     const RealtimeOnlineCourseTypeSchema = new mongoose.Schema({
//         //수업참가 스카이프
//         skypeLink: String,
    
//         //강의노트
//         lectureNote: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "LectureNote"
//         },
    
//         //출결확인
//         participation: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Participation"
//         },
    
//         //질의응답
//         qna: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "QnA"
//         },
    
//         //수업시간
//         lectureTime: {
//             startAt: Date,
//             duration: Number
//         },
    
//         //커리큘럼
//         course:[
//             {
//                 type: String
//             }
//         ]
//     });
    
//         //커리큘럼형 온라인 실시간X
//     const OnlineCourseTypeSchema = new mongoose.Schema({
//         //질의응답
//         qna: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "QnA"
//         },
    
//         //강의시청 : [{커리큘럼 : 동영상링크}]
    
//         //진도율
//         participation: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Participation"
//         },
    
//         //실시간채팅방
//         chattingRoom: String,
    
//         //커리큘럼
//         course:[
//             {
//                 description: String,
//                 link: String
//             }
//         ]
//     });
    
//         //질의응답형
//     const QnATypeSchema = new mongoose.Schema({
//         //수업시간
//         lectureTime: {
//             startAt: Date,
//             duration: Number
//         },
    
//         //질의응답
//         qna: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "QnA"
//         },
    
//         //실시간채팅방
//         chattingRoom: String,
//     });
    
//         //오프라인형
//     const OfflineTypeSchema = new mongoose.Schema({
//         //수업시간
//         lectureTime: {
//             startAt: Date,
//             duration: Number
//         },
    
//         //강의노트
//         lectureNote: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "LectureNote"
//         },
    
//         //출결확인
//         participation: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Participation"
//         },
    
//         //질의응답
//         qna: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "QnA"
//         },
//     });
    

// app.get('/', function(req, res){
//     if(req.session.username){
//         //로그인 되있는경우
//         User.findOne({username: req.session.username}, (err, user)=>{
//             if(err){
//                 console.log(req.session.username + '에 해당하는 유저를 찾을 수 없습니다.');
//             }
            
//             //내가 튜터인 강의 리스트 만들기
//             var classListAsTutor = '';
//             for(let classID of user.classesAsTutor){
//                 Class.findById(classID).then((res)=>{
//                     console.log(res);
//                     classListAsTutor = classListAsTutor + `<li>${res.className}<li>`;
//                 })
//             }

//             //내가 튜티인 강의 리스트 만들기
//             var classListAsTutee = '';
//             for(let classID of user.classesAsTutee){
//                 Class.findById(classID).then((res)=>{
//                     console.log(res);
//                     classListAsTutee = classListAsTutee + `<li>${res.className}<li>`;
//                 })
//             }
            
//             res.send(`
//                 <h1>Home</h1>
//                 <h2>Hello, ${user.nickname}</h2>
//                 <p>
//                     <a href="/auth/logout">logout</a>
//                 </p>
//                 <h2>내가 수업중인 Class</h2>
//                 <ul>${classListAsTutor}</ul>
//                 <h2>내가 수강중인 Class</h2>
//                 <ul>${classListAsTutee}</ul>
//             `);
//         });
//     }else{
//         //로그인 안되있는경우
//         res.send(`
//             <h1>Home</h1>
//             <p>
//                 please <a href="login.html">Login</a>
//             </p>
//         `);
//     }
// })