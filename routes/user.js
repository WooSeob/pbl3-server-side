var express = require("express");
var User = require("../Schemas/User");
var Class = require("../Schemas/Class");
var userRouter = express.Router();
var Mail = require("../Schemas/MailAuth");
const LectureDemandManager = require("../Controller/LectureDemandManager");

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
  if (req.body.id == "") {
    res.send("fail");
  } else if (req.body.password == "") {
    res.send("fail");
  } else if (req.body.nickname == "") {
    res.send("fail");
  } else if (req.body.major == "") {
    res.send("fail");
  } else {
    Mail.findOne({ webmail: req.body.id }, (err, mail) => {
      if (err) {
        res.send("fail");
        console.log("알수없는 webmail 주소 : " + req.body.id);
      }
      if (mail.isAuth == true) {
        User.create({
          id: req.body.id,
          password: req.body.password,
          nickname: req.body.nickname,
          major: req.body.major,
          point: 1000,
          classesAsTutee: [],
          classesAsTutor: [],
        });

        res.send("success");
        console.log(req.body.id + " 님의 회원가입이 정상처리 되었습니다.");
      } else {
        res.send("fail");
        console.log(req.body.id + " 님의 회원가입이 정상처리되지 않았습니다.");
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

userRouter.get("/:id/suggest", (req, res) => {
  let userID = req.session.uid;

  User.findById(userID, async (err, user) => {
    if (err) {
      return console.log(err);
    }

    if (!user) {
      res.send("fail");
      return console.log("해당 유저를 찾을 수 없습니다.");
    }

    let suggestList = await LectureDemandManager.Suggest(user);
    res.send(suggestList);
  });
});

//내가 튜터거나 튜티인 클래스들 받아오기
userRouter.get("/class", function (req, res) {
  if (req.session.uid) {
    User.findById(req.session.uid, async (err, user) => {
      if (err) {
        console.log("해당하는 유저를 찾을 수 없습니다.");
        return res.send("fail");
      }

      let classes = {
        AsTutor: new Array(),
        AsTutee: new Array(),
      };

      //내가 튜터인 강의 추가
      for (let classID of user.classesAsTutor) {
        let found = await Class.findById(classID);
        classes.AsTutor.push(found);
      }

      //내가 튜티인 강의 추가
      for (let classID of user.classesAsTutee) {
        let found = await Class.findById(classID);
        classes.AsTutee.push(found);
      }
      res.send(classes);
    });
  } else {
    res.send("잘못된 접근입니다.");
  }
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

// // ----------------------- 강의 추천 시스템 -----------------------
// userRouter.get("/suggestion", function(req, res){
   
// })


module.exports = userRouter;
