var express = require("express");
var User = require("../Schemas/User");
var Class = require("../Schemas/Class");
var userRouter = express.Router();

/*
    회원가입 user/ (post)
*/

//회원가입
userRouter.post("/", function (req, res) {
  
  /* 인증여부에 따라 가입이 되고 안되고 구현 해야함 */
  User.create({
    username: req.body.username,
    password: req.body.password,
    nickname: req.body.nickname,
    webmail: req.body.webmail,
    point: 1000,
    classesAsTutee: [],
    classesAsTutor: [],
  });
  res.send("Create Successfully");
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
userRouter.get("/tutor", function (req, res) {
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
userRouter.get("/tutee", function (req, res) {
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
