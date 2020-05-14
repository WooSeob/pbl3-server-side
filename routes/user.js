var express = require("express");
var User = require("../Schemas/User");
var Class = require("../Schemas/Class");
var userRouter = express.Router();
var Mail = require("../Schemas/MailAuth");
const hknuAddress = "@hknu.ac.kr";
/*
    회원가입 /register -> /
*/

function deleteInfo(userWebmail) {
  var d = new Date();
  var currentHourDB = d.getHours();
  var currentMinuteDB = d.getMinutes();
  var currentSecondDB = d.getSeconds();

  Mail.deleteOne({ webmail: userWebmail }, function (err) {
    if (err) {
      return handleError(err);
    } else {
      console.log(
        "\n***** " +
          userWebmail +
          " 님의 인증정보가 DB에서 삭제되었습니다!  (Time :" +
          currentHourDB +
          "시 " +
          currentMinuteDB +
          "분 " +
          currentSecondDB +
          "초) *****"
      );
    }
  });
}

userRouter.use(express.json());

//회원가입
userRouter.post("/", function (req, res) {
  /* 인증여부에 따라 가입이 되고 안되고 구현 */
  /* 비어있는 칸이 있으면 에러 발생함 - 예외처리 */
  if (req.body.webmail == "") {
    res.send("webmail을 입력해주세요!");
  } else if (req.body.username == "") {
    res.send("username을 입력해주세요!");
  } else if (req.body.password == "") {
    res.send("password를 입력해주세요!");
  } else if (req.body.nickname == "") {
    res.send("nickname을 입력해주세요!");
  } else {
    Mail.findOne({ webmail: req.body.webmail }, (err, mail) => {
      if (mail.isAuth == true) {
        User.create({
          username: req.body.username,
          password: req.body.password,
          nickname: req.body.nickname,
          webmail: req.body.webmail,
          point: 1000,
          classesAsTutee: [],
          classesAsTutor: [],
        });

        res.send("success");
        console.log(
          req.body.webmail +
            hknuAddress +
            " 님의 회원가입이 정상처리 되었습니다."
        );

        deleteInfo(req.body.webmail);
      } else {
        res.send("fail");
        console.log(
          req.body.webmail +
            hknuAddress +
            " 님의 회원가입이 정상처리되지 않았습니다."
        );

        deleteInfo(req.body.webmail);
      }
    });
  }
});

//Username으로 유저 정보요청
userRouter.get("/name/:name", function (req, res) {
  var targetName = req.params.name;

  let query = {
    username: targetName,
  };
  if (targetName == "all") {
    query = null;
  }

  User.find(query, (err, data) => {
    console.log(data);
    res.send(data);
  });
});

//ID로 유저 정보요청
userRouter.get("/:id", function (req, res) {
  var targetID = req.params.id;

  User.findById(targetID, (err, data) => {
    console.log(data);
    res.send(data);
  });
});

//내가 튜터인 클래스들 받아오기
userRouter.get("/class/tutor", function (req, res) {
  if (req.session.uid) {
    User.findById(req.session.uid, async (err, user) => {
      if (err) {
        console.log("해당하는 유저를 찾을 수 없습니다.");
        return res.send("fail");
      }
      //내가 튜터인 강의 리스트 만들기
      let classList = new Array();
      for (let classID of user.classesAsTutor) {
        let found = await Class.findById(classID);
        classList.push(found);
      }
      res.json(classList);
    });
  } else {
    res.send("잘못된 접근입니다.");
  }
});

//내가 튜티인 클래스들 받아오기
userRouter.get("/class/tutee", function (req, res) {
  if (req.session.uid) {
    User.findById(req.session.uid, async (err, user) => {
      if (err) {
        console.log("해당하는 유저를 찾을 수 없습니다.");
        return res.send("fail");
      }
      //내가 튜티인 강의 리스트 만들기
      let classList = new Array();
      for (let classID of user.classesAsTutee) {
        let found = await Class.findById(classID);
        classList.push(found);
      }
      res.json(classList);
    });
  } else {
    res.send("잘못된 접근입니다.");
  }
});

module.exports = userRouter;
