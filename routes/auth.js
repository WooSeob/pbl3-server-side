var express = require('express');
//var Class = require('../Schemas/Class');
var User = require('../Schemas/User');
var mongoose = require('mongoose');
var router = express.Router();
const smtpTransport = require('nodemailer-smtp-transport');
const nodemailer = require('nodemailer');

var MailAuth = require('../Schemas/MailAuth');
var AuthMail = mongoose.model("MailAuth", MailAuth);



// TODO 비밀번호 암호화 할것
// 로그인
router.post('/login', function(req, res) {
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
            req.session.uid = user._id;
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
router.get('/logout', function(req, res){
    delete req.session.uid;
    req.session.save(()=>{
        console.log(req.session);
        console.log('로그아웃 됬습니다.');
        res.redirect('/')
    })
})

//로그인정보 받아오기
router.get('/isAuthenticated', function(req, res){
    //로그인 되있으면 유저정보 응답
    //로그인 안되있으면 'fail' 응답
    if(req.session.uid){
        User.findById(req.session.uid, (err, user)=>{
            if(err){
                console.log(req.session.uid + '에 해당하는 유저를 찾을 수 없습니다.');
            }
            res.send(user.toJSON());
        });
    }else{
        res.send('fail');
    }
})

var randomNumber
// 회원가입 페이지에서 인증번호 발송 요청
// 사용자 유저 이메일주소 받아오기
router.post('/send-email', function(req, res){

    //메일주소 입력창에 아무것도 입력하지 않으면 alert 발생
    if(req.body.email === '') {
      res.send(
        `<script type="text/javascript">
          alert("메일주소를 입력해주세요."); 
          window.location = 'http://localhost:8080'; 
      </script>`);
    }
    
    let userEmail = (req.body.email+'@hknu.ac.kr');

    console.log("\nemail :", userEmail);
    
    //메일 보내는 Function - sendMail
    randomNumber = sendMail(userEmail);
    res.send('<script type="text/javascript">alert("메일 발송했습니다.");</script>');

  });
  
  // auth라우터에서 라우팅
  // 인증번호 검증
router.post('/auth-email', function(req, res){
    let authNum = req.body.authNum;
  
    console.log('인증번호(User)  :   '+ authNum);
  
    //인증 여부 alert으로 알려줌
  
    if(authNum == randomNumber){
        console.log('인증성공')
        res.send('<script type="text/javascript">alert("인증 성공했습니다!");</script>');
    } else{
        res.send('<script type="text/javascript">alert("인증 실패했습니다!");</script>');
    }
});

// 발급된 인증번호와 사용자 메일 주소를 디비에 저장..
function insertInfo(email, randomNumber) {
  var mailAuthInfo = new AuthMail({
    webmail : email,
    authNum : randomNumber 
  });

  mailAuthInfo.save(function(err){
    if(err){
      return err;
    }
  });
  console.log("이게 잘 뜬다면 아마도 이메일과 인증번호는 정상적으로 들어갔을거야..");
}


// 발급된 인증번호를 3분후에 삭제 -> 3분 타이머
function deleteInfo() {
  console.log('this is test for delete authnum in DB with 3minutes!');
}

  
  // 얘는 그냥 함수
  /* 이메일 보내는 함수 */
function sendMail(email){
  
    // 메일 인증번호 랜덤하게 발생 시키기 (100000~999999)  
    function randomNum(min, max){
      return Math.floor(Math.random() * (max-min)) + min;
    }
    randomNumber = randomNum(100000,999999);
  
    
      // 이메일 기본 설정 
      var transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
          user: 'tutor2tutee@gmail.com',
          pass: 'ansgovm3!'
        }
      }));
      
      // 이메일 형식 
      var mailOptions = {
        from: 'tutor2tutee@gmail.com',
        to: email,
        subject: 'Tutor2Tutee를 회원가입을 위한 메일 입니다.',
        text: '인증번호 ['+randomNumber+']을 입력해주세요! 감사합니다.'
      };
      
      // 이메일 보내기 
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent complete! : ' + info.response);
          console.log('인증번호(System): ' + randomNumber)
        }
      });

      
      // setTimeout(Func, time) time - 1000 = 1 sec, 60000 = 1 min, 180000 = 3 min
      setTimeout(insertInfo(email, randomNumber), 1500);
      setTimeout(deleteInfo, 180000); 

      return randomNumber;
  }

module.exports = router;