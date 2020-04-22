const express = require('express');
const nodemailer = require('nodemailer');
const http = require('http');
const app = new express();
const server = http.createServer(app);
const smtpTransport = require('nodemailer-smtp-transport');
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(req, res){
    fs.readFile('/public/mailAuth.html', function(err, data){
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end(data);
    });
});

// 실질적으로 메일이 보내지는 곳
app.post('/send-email', function(req, res){

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
  sendMail(userEmail);
  
});

// 인증하는 시스템
app.post('/auth-email', function(req, res){
  let authNum = req.body.authNum;

  console.log('인증번호(User)  :   '+ authNum);

  //인증 여부 alert으로 알려줌

  if(authNum == randomNumber){
    res.send('<script type="text/javascript">alert("인증 성공했습니다!");</script>');
  } else{
    res.send('<script type="text/javascript">alert("인증 실패했습니다!");</script>');
  }

});

server.listen(8888, function(){
    console.log('\n--- 서버 실행 중 ---');
});

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
    
    //이메일 형식 
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

    return randomNumber;
}



