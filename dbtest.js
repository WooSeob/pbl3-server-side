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

var app = new express();

const socket = require('socket.io');
const http  = require('http');
const server = http.createServer(app);
const io = socket(server);
const fs = require('fs');

//CORS setting
const cors = require('cors');
app.use(cors());

app.use('/css', express.static('./static/css'));
app.use('/js', express.static('./static/js'));

 //메일 인증 시스템 Start ----------
//var nodemailer = require('nodemailer');

// var smtpTransport = nodemailer.createTransport({
//     service: "Gamil",
//     auth: {
//         user: "Your Gamil ID",
//         pass: "Gamil password"
//     }
// });

// var rand, mailOptions, host, link;

// app.get('/test_mail', function(req, res){
//     res.sendfile('index_mail.html');
// });

// app.get('/mail_send', function(req, res){
//     rand=Math.floor((Math.random() * 100) + 54);
//     host = req.get('host');
//     link = "http://"+req.get('host')+"/verify?id="+rand;
//     mailOptions={
//         to: req.query.to,
//         subject: "please confirm your Eamil account",
//         html : "Hello, <br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
//     }
//     console.log(mailOptions);
//     smtpTransport.sendMail(mailOptions, function(error, res){
//         if(error){
//                 console.log(error);
//             res.end("error");
//         } else {
//                 console.log("Message sent: " + Response.message);
//             res.end("sent");
//         }
//     });
// });

// app.get('/verify', function(req, res){
//     console.log(req.protocol + ":/"+req.get('host'));
//     if((req.protocol+"://"+req.get('host'))==("http://"+host))
//     {
//         console.log("Domain is matched. Informaiton is from Authentic email");
//         if(req.query.id == rand){
//             console.log("email is verified");
//             res.end("<h1>Email "+mailOptions.to+" is been successfully verified!");
//         }
//         else{
//             console.log("email is not verified");
//             res.end("<h1>Bad Request</h1>");
//         }
//     }
//     else{
//         res.end("<h1>Request is from unknown source");
//     }
// });


// async function main(){    

//     let testAccount = await nodemailer.createTestAccount();

//     let transporter = nodemailer.createTransport({
//         host: "smtp.ethereal.email",
//         port: 587,
//         secure: false, 
//         auth: {
//             user: 'wanda.blick84@ethereal.email', 
//             pass: '7Qyk9upV4fFrW9MU8e'
//         }
//     });

//     let info = await transporter.sendMail({
//         from: '"Fred Foo " <foo@example.com>',
//         to: "rkdaudwh13@naver.com",
//         subject: "Tutor2Tutee 인증 메일 입니다. ",
//         text: "인증번호를 입력하세요!, 인증번호 : 0413 ", // plain text body
//         html: "<b>인증번호를 입력하세요!, 인증번호 : 0413 </b>" // html body   
//     });

//     console.log("Message sent: %s", info.messageId);
//     // 예 : Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
 
//      // Preview only available when sending through an Ethereal account
//     console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
//     // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
// }

// main().catch(console.error);
//메일 인증 시스템 End ----------

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


//실시간 채팅방 Start -----  
app.get('/chat', function(req, res){
    fs.readFile('./static/js/index.html', function(err, data) {
        if(err){
            res.send("에러다 !!");
        } else {
            res.writeHead(200, {'Content-Type':'text/html'});
            res.write(data);
            res.end();
        }
    })
});
//소켓에서 연결 이벤트를 받으면, 콜백함수 실행
//io.sockets는 접속되는 모든 소켓들을 칭함
//바로 아랫줄 콜백함수의 socket은 접속된 해당 소켓
io.sockets.on('connection', function(socket){
     console.log('\n유저 접속 됨!\n');

    //새로운 유저 접속 알려주기 - 접속 성공시 클라이언트에서 이벤트 발생
    socket.on('newUser', function(name){
        console.log(name + ' 님이 접속하였습니다!');

        //이름 정하기
        socket.name = name;

        //모든 소켓에게 전송하기 
        io.sockets.emit('update', {type:'connect', name:'SERVER', message:name+' 님이 접속하였습니다!'});
    })


socket.on('message', function(data){
    data.name = socket.name;
    console.log(data);
    
    socket.broadcast.emit('update', data);
})
//소켓에서 연결 해제 이벤트를 받으면, 콜백함수 실행
socket.on('disconnect', function(){
    console.log(socket.name+'님이 접속을 종료 했습니다..');

//나가는 사람을 제외한 나머지 사람들에게 메세지 전송
socket.broadcast.emit('update', {type:'disconnect', name : 'SERVER', message: socket.name+'님이 접속을 종료했습니다!'});
})

});

app.get('/', function(req, res){
    res.send('<h1>Hello home page</h1>');
});

app.listen(3000, function(){
    console.log('Connected 3000 port!');
});