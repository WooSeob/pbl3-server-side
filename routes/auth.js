var express = require("express");
//var Class = require('../Schemas/Class');
var User = require("../Schemas/User");
var router = express.Router();
var mongoose = require("mongoose");
const smtpTransport = require("nodemailer-smtp-transport");
const nodemailer = require("nodemailer");
var Mail = require("../Schemas/MailAuth");
var GradeSchema = require("../Schemas/GradeInfo");
const Grade = mongoose.model("grade", GradeSchema);
mongoose.set("useFindAndModify", false);
const multer = require("multer");

router.use(express.json());

// TODO 비밀번호 암호화 할것
// 로그인
router.post("/login", function (req, res) {
  var uname = req.body.id;
  var pwd = req.body.password;
  console.log(uname);
  User.findOne({ id: uname }, (err, user) => {
    console.log(user);
    if (err || user == null) {
      console.log("존재하지않는 아이디");
      res.send("fail");
      return;
    }
    console.log(user);
    if (pwd == user.password) {
      //로그인 성공
      req.session.uid = user._id;
      req.session.save(() => {
        console.log(req.session);
        console.log("로그인 성공.");
        res.send("success");
      });
    } else {
      res.send("fail");
    }
  });
});

//로그아웃
router.get("/logout", function (req, res) {
  delete req.session.uid;
  req.session.save(() => {
    console.log(req.session);
    console.log("로그아웃 됬습니다.");
    res.redirect("/");
  });
});

//로그인정보 받아오기
router.get("/isAuthenticated", function (req, res) {
  //로그인 되있으면 유저정보 응답
  //로그인 안되있으면 'fail' 응답
  if (req.session.uid) {
    User.findById(req.session.uid, (err, user) => {
      if (err) {
        console.log(req.session.uid + "에 해당하는 유저를 찾을 수 없습니다.");
      }
      res.send(user.toJSON());
    });
  } else {
    res.send("fail");
  }
});

var randomNumber;

// 회원가입 페이지에서 인증번호 발송 요청
// 사용자 유저 이메일주소 받아오기
router.post("/sendemail", function (req, res) {
  //메일주소 입력창에 아무것도 입력하지 않으면 alert 발생
  if (req.body.email === "") {
    res.send("fail");
  }

  let userEmail = req.body.email;

  // 메일 보내는 Function - sendMail
  randomNumber = sendMail(userEmail + hknuAddress);

  //클라이언트에게 이메일 보낸주소를 리턴
  res.send(userEmail + hknuAddress);

  Mail.findOne({ webmail: userEmail }, (err, mail) => {
    if (err) {
      console.log(err + " 에러발생");
      res.send("fail");
      return;
    }

    if (mail == null) {
      // DB에 저장
      var mailAuthInfo = new Mail({
        webmail: userEmail,
        authNum: randomNumber,
        isAuth: false,
      });

      mailAuthInfo.save(function (err) {
        if (err) {
          res.send("fail");
          return err;
        }
        var e = new Date();
        var currentHour = e.getHours();
        var currentMinute = e.getMinutes();
        var currentSecond = e.getSeconds();

        console.log(
          "\n***** DB에 메일주소: " +
            userEmail +
            hknuAddress +
            " , 인증번호: " +
            randomNumber +
            " 추가 됨 *****  (Time : " +
            currentHour +
            "시 " +
            currentMinute +
            "분 " +
            currentSecond +
            "초)"
        );
      });
    } else {
      Mail.findOneAndUpdate(
        { webmail: userEmail },
        { authNum: randomNumber },
        function (err) {
          if (err) {
            res.send("fail");
            console.log("이미 있는 메일주소이긴 하지만 에러가 발생합니다.");
          }

          var f = new Date();
          var currentHour = f.getHours();
          var currentMinute = f.getMinutes();
          var currentSecond = f.getSeconds();

          res.send("update success");
          console.log(
            "\n***** DB에 메일주소: " +
              userEmail +
              hknuAddress +
              " , 인증번호: " +
              randomNumber +
              " 갱신 됨 *****  (Time : " +
              currentHour +
              "시 " +
              currentMinute +
              "분 " +
              currentSecond +
              "초)"
          );
        }
      );
    }
  });
});

// auth라우터에서 라우팅
// 인증번호 검증
router.post("/authemail", function (req, res) {
  let userAuthNum = req.body.authNum;
  let userWebmail = req.body.email;

  // console.log('인증번호(User)  :   '+ userAuthNum);
  console.log("사용자 입력 이메일 주소 : " + userWebmail);
  console.log("사용자 입력 인증번호  :   " + userAuthNum);

  // 3분이 지나면 DB에 있는 정보를 삭제하는 Function

  Mail.findOne({ webmail: userWebmail }, (err, mail) => {
    if (err || mail == null) {
      console.log("존재하지않는 웹메일");
      res.send("fail");
      return;
    }

    console.log("인증번호 in DB : " + mail.authNum);
    var authNumInDB = mail.authNum;

    if (userAuthNum == authNumInDB) {
      console.log("----- " + userWebmail + "님 인증에 성공하였습니다. -----");
      res.send("success");

      //인증 되면 isAuth 값 true로 바뀜
      Mail.findOne({ webmail: userWebmail }, (err, mail) => {
        if (err || mail == null) {
          console.log("존재하지않는 웹메일");
          res.send("fail");
          return;
        }
        mail.isAuth = true;
        mail.save();
      });
    } else {
      console.log("----- " + userWebmail + "님 인증에 실패하였습니다. -----");
      res.send("fail");

      Mail.findOne({ webmail: userWebmail }, (err, mail) => {
        mail.isAuth = false;
        mail.save();
      });
    }
  });
});

// 얘는 그냥 함수
/* 이메일 보내는 함수 */
function sendMail(email) {
  // 메일 인증번호 랜덤하게 발생 시키기 (100000~999999)
  function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  randomNumber = randomNum(100000, 999999);

  // 이메일 기본 설정
  var transporter = nodemailer.createTransport(
    smtpTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      //TODO 개인정보는 json파일로 추출하고, 그 파일은 gitignore에 추가하기 (보안)
      auth: {
        user: "tutor2tutee@gmail.com",
        pass: "ansgovm3!",
      },
    })
  );

  // 이메일 형식
  var mailOptions = {
    from: "tutor2tutee@gmail.com",
    to: email,
    subject: "Tutor2Tutee를 회원가입을 위한 메일 입니다.",
    text: "인증번호 [" + randomNumber + "]을 입력해주세요! 감사합니다.",
  };

  // 이메일 보내기
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("***** 인증메일이 정상적으로 발송되었습니다! *****");
    }
  });

  return randomNumber;
}

// 미들 웨어
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },

  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("gradeAuth"), function (req, res) {
  res.send("Uploaded : " + req.file.originalname);
  console.log("성적인증 " + req.file.originalname);

  var newImage = new Grade({
    gradeImage: { fileName: req.file.originalname, path: req.file.path },
  });

  newImage.save(function (err) {
    if (err) {
      res.send("fail");
      return err;
    }
  });
});

module.exports = router;
