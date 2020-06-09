var express = require("express");
var mongoose = require("mongoose");
var Class = require("../Schemas/Class");
var User = require("../Schemas/User");

const ClassConst = require("../Const/Class");
const ClassStateManager = require("../Controller/ClassStateManager");
const ClassDataChecker = require("../Controller/DataManager");

var QnASchema = require("../Schemas/QnA");
var ClassBasicInfoSchema = require("../Schemas/ClassBasicInfo");
var CourseSchema = require("../Schemas/Course");
var LectureTimeSchema = require("../Schemas/LectureTime");
var LectureNoteSchema = require("../Schemas/LectureNote");
var AttendanceSchema = require("../Schemas/Participation");
var LectureDemandSchema = require("../Schemas/LectureDemand");

const QnA = mongoose.model("QnA", QnASchema);
const Course = mongoose.model("Course", CourseSchema);
const ClassBasicInfo = mongoose.model("ClassBasicInfo", ClassBasicInfoSchema);
const LectureTime = mongoose.model("LectureTime", LectureTimeSchema);
const LectureNote = mongoose.model("LectureNote", LectureNoteSchema);
const Attendance = mongoose.model("Attendance", AttendanceSchema);
const LectureDemand = mongoose.model("LectureDemand", LectureDemandSchema);

var classRouter = express.Router();
classRouter.use(express.json());

//수업생성
classRouter.post("/", function (req, res) {
  //튜터 아이디로 수업 생성
  User.findById(req.session.uid, async (err, tutor) => {
    if (err) {
      res.send("fail");
      return;
    }

    console.log("\n|----------- 강의개설 ------------");
    console.log("| 강 의 명 : " + req.body.className);
    console.log("| 강의타입 : " + req.body.classType);

    //기본적으로 강의개설직후는 '준비중' 상태
    var newClass = new Class({
      classType: req.body.classType,
      category: req.body.category,
      studyAbout: req.body.studyAbout,
      className: req.body.className,
      price: req.body.price,
      tutor: tutor._id,
      state: ClassConst.state.PREPARE,
    });

    //기본정보
    if (req.body.grade && req.body.class_description) {
      let basicInfo = new ClassBasicInfo({
        grade: req.body.grade,
        description: req.body.class_description,
      });
      await newClass.addClassData("BasicInfo", basicInfo, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //커리큘럼 데이터 있으면 추가
    if (req.body.course_description) {
      newCourse = new Course({
        description: req.body.course_description,
      });
      await newClass.addClassData("Course", newCourse, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //강의시간 데이터 있으면 추가
    if (req.body.lectureTimes) {
      let Times = new Array();
      for(let lectureTime of req.body.lectureTimes){
        Times.push(new LectureTime(lectureTime))
      }
      
      await newClass.addClassData("LectureTime", Times, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //최대튜티수 데이터 있으면 추가
    if (req.body.maxTutee) {
      await newClass.addClassData("MaxTutee", req.body.maxTutee, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //스카이프링크 데이터 있으면 추가
    if (req.body.skypeLink) {
      await newClass.addClassData("SkypeLink", req.body.skypeLink, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //수업장소 데이터 있으면 추가
    if (req.body.place) {
      await newClass.addClassData("Place", req.body.place, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    if (newClass.state == ClassConst.state.JOIN_ABLE) {
      //AsTutor 항목에 새로 만든 클래스 추가
      tutor.classesAsTutor.push(newClass._id);
      //강의 추가
      await newClass.save(() => {
        console.log("새로운 강의정보 데이터베이스에 저장");
      });
      await tutor.save(() => {
        console.log("새로운 강의를 classAsTutor에 추가하고 저장");
      });

      console.log("클라이언트 응답 : " + newClass._id);
      res.send(newClass._id);
    } else {
      console.log("클라이언트 응답 : fail");
      console.log(
        newClass.classType + "타입에 필요한 정보가 모두 채워지지 않았습니다."
      );
      res.send("fail");
    }
  });
});

//수업명으로 수업 정보 받아오기
classRouter.get("/name/:name", function (req, res) {
  let targetClassName = req.params.name;
  let query = {
    className: targetClassName,
  };
  if (targetClassName == "all") {
    query = null;
  }

  Class.find(query)
    .then(async (data) => {
      //튜터 닉네임정보들 추가해서 response
      let rDatas = new Array();
      for (let Class of data) {
        await User.findById(Class.tutor, (err, user) => {
          if (err) {
            console.log(err);
            return res.send("fail");
          }

          let rData = Class.toObject();
          rData.tutorNickName = user.nickname;
          rDatas.push(rData);
        });
      }
      res.send(rDatas);
    })
    .catch((err) => {
      console.log(err);
    });
});

//수업id로 정보 받아오기
classRouter.get("/:id", function (req, res) {
  let targetClassID = req.params.id;
  Class.findById(targetClassID, (err, Class) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    //튜터 닉네임 추가해서 응답
    User.findById(Class.tutor, (err, user) => {
      if (err) {
        console.log(err);
        return res.send("fail");
      }

      let rData = Class.toObject();
      rData.tutorNickName = user.nickname;
      res.send(rData);
    });
  });
});
//------------------------------------    정보추가    ------------------------------------
//강의 기본정보 (성적인증이미지url, 소개글) 추가
classRouter.post("/:id/basic-info", (req, res) => {
  let targetClassID = req.params.id;
  var info = new ClassBasicInfo({
    grade: req.body.grade,
    description: req.body.description,
  });
  Class.findByIdAndUpdate(targetClassID, { basicInfo: info }, (err, found) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }
    ClassStateManager.checkPrepared(found);
    res.send(found);
  });
});

//강의 커리큘럼 추가
classRouter.post("/:id/course", (req, res) => {
  //@@@ 이 함수는 받아온 데이터로 course 만들어서 Class.course배열에 계속해서 집어넣는 함숩니다.
  let targetClassID = req.params.id;
  let userID = req.session.uid;

  var newCourse = new Course({
    description: req.body.description,
    link: req.body.link,
  });

  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    Class.addClassData("Course", targetClassID, newCourse, (errmsg, Class) => {
      if (errmsg) {
        console.log(errmsg);
        return res.send("fail");
      }
      Class.save(() => {
        res.send("success");
      });
    });
  });
});

//강의시간 추가
classRouter.post("/:id/lecture-time", (req, res) => {
  //@@@ 이 함수는 받아온 데이터로 LectureTime 만들어서 Class.LectureTime배열에 계속해서 집어넣는 함숩니다.
  let targetClassID = req.params.id;
  let userID = req.session.uid;

  //TODO 배열로 받아서 추가하도록 변경
  var newTime = new LectureTime({
    day: req.body.time_day,
    start: req.body.time_start,
    finish: req.body.time_finish,
  });

  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    Class.addClassData(
      "LectureTime",
      targetClassID,
      newTime,
      (errmsg, Class) => {
        if (errmsg) {
          console.log(errmsg);
          return res.send("fail");
        }
        Class.save(() => {
          res.send("success");
        });
      }
    );
  });
});

//최대 튜티수 추가
classRouter.post("/:id/max-tutee", (req, res) => {
  //@@@ 이 함수는 Class.maxTutee에 받아온 데이터를 넣는 함숩니다.
  let targetClassID = req.params.id;
  let userID = req.session.uid;
  let numMaxTutee = req.body.maxTutee;

  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    Class.addClassData(
      "MaxTutee",
      targetClassID,
      numMaxTutee,
      (errmsg, Class) => {
        if (errmsg) {
          console.log(errmsg);
          return res.send("fail");
        }
        Class.save(() => {
          res.send("success");
        });
      }
    );
  });
});

//스카이프 링크 추가
classRouter.post("/:id/skype", (req, res) => {
  //@@@ 이 함수는 Class.skypelink에 받아온 스카이프 링크를를 넣는 함숩니다.
  let targetClassID = req.params.id;
  let userID = req.session.uid;
  let skypeLink = req.body.skypeLink;

  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    Class.addClassData(
      "SkypeLink",
      targetClassID,
      skypeLink,
      (errmsg, Class) => {
        if (errmsg) {
          console.log(errmsg);
          return res.send("fail");
        }
        Class.save(() => {
          res.send("success");
        });
      }
    );
  });
});

//강의 시작
classRouter.get("/:id/start", (req, res) => {
  let userID = req.session.uid;
  let targetClassID = req.params.id;

  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    Class.findById(targetClassID, (err, Class) => {
      if (err) {
        console.log(err);
        return res.send("fail");
      }

      ClassStateManager.startLecture(Class, (err) => {
        if (err) {
          console.log(err);
          return res.send("fail");
        }
        res.send("success");
      });
    });
  });
});

//------------------------------------    QnA    ------------------------------------
//QnA 질문 게시글 조회
classRouter.get("/:id/question", (req, res) => {
  let targetClassID = req.params.id;

  Class.findById(targetClassID, (err, Class) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }
    console.log(Class);
    res.send(Class.qna);
  });
});

//QnA 질문 추가
classRouter.post("/:id/question", (req, res) => {
  //질문은 해당 수업의 튜티가 한다.
  //그 수업의 상태는 수업진행중이어야 한다 ?
  let targetClassID = req.params.id;
  let content = req.body.content;
  let userID = req.session.uid;

  User.isTuteeOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    //질문추가
    let newQuestion = QnA({
      question: {
        Writer: userID,
        content: content,
      },
    });
    Class.addClassData(
      "Question",
      targetClassID,
      newQuestion,
      (errmsg, Class) => {
        if (errmsg) {
          console.log(errmsg);
          return res.send("fail");
        }
        Class.save(() => {
          res.send("success");
        });
      }
    );
  });
});
//QnA 답변 추가
classRouter.post("/:id/question/:qid", (req, res) => {
  //답변은 튜터가 한다.
  //그 수업의 상태는 수업진행중이어야 한다 ?
  //작성된 질문에 대해 답변 하는것이다.
  //답변이 기존에 안달린 질문에 답변을 하는것이다.
  let targetClassID = req.params.id;
  let targetQuestion = req.params.qid;
  let content = req.body.content;
  let userID = req.session.uid;
  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    let newAnswer = {
      target: targetQuestion,
      content: content,
    };
    Class.addClassData("Answer", targetClassID, newAnswer, (errmsg, Class) => {
      if (errmsg) {
        console.log(errmsg);
        return res.send("fail");
      }
      Class.save(() => {
        res.send("success");
      });
    });
  });
});

//------------------------------------    강의노트    ------------------------------------
//강의노트 전체 조회
classRouter.get("/:id/lecture-note", (req, res) => {
  let targetClassID = req.params.id;

  Class.findById(targetClassID, (err, Class) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }
    console.log(Class);
    res.send(Class.lectureNote);
  });
});

//강의노트 게시글 추가
classRouter.post("/:id/lecture-note", (req, res) => {
  //강의노트 작성은 해당 수업의 튜터가 한다.
  //그 수업의 상태는 수업진행중이어야 한다 ?

  let userID = req.session.uid;
  let targetClassID = req.params.id;
  let title = req.body.title;
  let content = req.body.content;

  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    //강의노트 추가
    let newNote = new LectureNote({
      title: title,
      content: content,
    });
    Class.addClassData(
      "LectureNote",
      targetClassID,
      newNote,
      (errmsg, Class) => {
        if (errmsg) {
          console.log(errmsg);
          return res.send("fail");
        }
        Class.save(() => {
          res.send("success");
        });
      }
    );
  });
});
//------------------------------------    출결관리    ------------------------------------

//1. 출결 확인
classRouter.get("/:id/attendance/my", (req, res) => {
  let userID = req.session.uid;
  let targetClassID = req.params.id;
  User.isTuteeOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }

    Class.findById(targetClassID, (err, found) => {
      if (err) {
        console.log(errmsg);
        return res.send("fail");
      }

      //TODO 클래스 타입별 기능 구현하기
      let attendanceData = new Array();
      for (let attendandce of found.participations) {
        attendanceData.push({
          date: attendandce.startTime,
          isAttend: attendandce.tutees.includes(userID),
        });
      }
      res.send(attendanceData);
    });
  });
});

//2. 출석 요청
classRouter.get("/:id/attendance", (req, res) => {
  //1. 인증번호 생성
  //2. 실시간 채팅방 생성
  let userID = req.session.uid;
  let targetClassID = req.params.id;

  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }
    //1. 커리큘럼 온라인 실시간 Or 오프라인형 => 인증번호생성
    //2. 질의응답형 => 채팅방생성
    //3. 동영상 강의형의 경우 수업객체를 커리큘럼을 추가될떄 자동으로 생성된다.
    Class.generateAttendance(targetClassID, (errmsg, authData) => {
      if (errmsg) {
        console.log(errmsg);
        return res.send("fail");
      }
      //인증번호 or 채팅방주소 응답
      res.send(authData);
    });
  });
});

//3. 출석 인증
classRouter.post("/:id/attendance", (req, res) => {
  //1. 인증번호 인증 -> 튜터 : 인증번호 생성 -> 튜티 : 인증 요청
  //2. 동영상 '봤어요' -> 해당 attendance에 직접 api호출 해야함.
  //3. 채팅방 입장시  -> 튜터 : 채팅방 오픈 -> 튜티 : 입장 (인증 성공)
  let userID = req.session.uid;
  let targetClassID = req.params.id;
  let auth = req.body.auth;

  User.isTuteeOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }
    // ----- 출석 인증 Process -----
    //강의가 InProgress인가?
    //수업.가장최근.인증번호 == 요청번호 && 수업.가장최근.생성일 + 3분 > 지금
    //수업.가장최근.tutees.push(userID)
    //성공 응답
    Class.attendance(targetClassID, auth, userID, (errmsg) => {
      if (errmsg) {
        console.log(errmsg);
        return res.send("fail");
      }
      res.send("success");
    });
  });
});

//----------------------------------    유저 평가    ----------------------------------
// 유저 평가
classRouter.post("/:cid/rating/:uid", (req, res) => {
  //1. target Class includes users (userID, targetUserID)
  //2. userID rates targetUserID for value

  let userID = req.session.uid;
  let targetClassID = req.params.cid;
  let targetUserID = req.params.uid;
  let value = req.body.value;

  if (value < 1 || value > 5 || !value) {
    console.log("평가 점수가 1~5 범위를 벗어났습니다.");
    res.send("fail");
  }

  User.isTuteeOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }
    //1. 튜티가
    User.isTutorOf(targetUserID, targetClassID, (err, user) => {
      if (err) {
        console.log(err);
        return res.send("fail");
      }
      // 튜터 평가
      user.rateAsTutor(value);
      res.send("success");
    });
  });
  User.isTutorOf(userID, targetClassID, (err, user) => {
    if (err) {
      console.log(err);
      return res.send("fail");
    }
    //2. 튜터가
    User.isTuteeOf(targetUserID, targetClassID, (err, user) => {
      if (err) {
        console.log(err);
        return res.send("fail");
      }
      // 튜티 평가
      user.rateAsTutee(value);
      res.send("success");
    });
  });
});

//----------------------------------    수업참여,쳘회    ----------------------------------
//수업 철회하기
classRouter.get("/:id/quit", function (req, res) {
  let targetClassID = req.params.id;
  let userID = req.session.uid;

  if (!userID) {
    console.log("로그인 후 이용해 주세요");
    res.send("fail");
    return;
  }

  User.findById(userID, async (err, user) => {
    userID = await user._id;

    Class.findById(targetClassID, (err, targetClass) => {
      let isDeleted = false;
      //targetClass.tutee 중 해당 user가 포함되있을때만 탈퇴 가능하다.
      //user.classesAsTutee 에서 해당 targetclass._id 를 삭제한다.
      //targetClass.tutee 에서 해당 user._id를 삭제한다.

      //Class.tutees에서 해당 유저 제거
      for (let tuteeID of targetClass.tutees) {
        if (String(userID) == String(tuteeID)) {
          targetClass.tutees.pull(user._id);
          console.log("user : " + user._id + " 삭제 from class");
          isDeleted = true;
        }
      }
      //User.classesAsTutee에서 해당 수업 제거
      for (let classID of user.classesAsTutee) {
        if (String(targetClass._id) == String(classID)) {
          user.classesAsTutee.pull(targetClass._id);
          console.log("class : " + targetClass._id + " 삭제 from user");
          isDeleted = true;
        }
      }

      if (isDeleted) {
        //삭제성공
        if (targetClass.state == ClassConst.state.JOIN_ABLE) {
          //강의시작전에 수강취소한경우 포인트환불
          user.point = user.point + targetClass.price;
        }
        res.redirect("/");
      } else {
        //삭제실패
        res.send("fail");
      }

      //변동사항 저장
      targetClass.save();
      user.save();
    });
  });
});

//수업 참여하기
classRouter.get("/:id/join", function (req, res) {
  let targetClassID = req.params.id;
  let userID = req.session.uid;

  if (!userID) {
    console.log("로그인 후 이용해 주세요");
    res.send("fail");
    return;
  }
  User.findById(userID, async (err, user) => {
    Class.findById(targetClassID, (err, targetClass) => {
      if (err) {
        console.log(err);
        return res.send("fail");
      }
      let joinAllowed = true;

      // 해당 강의가 open되지 않은경우 or 정원초과
      if (!targetClass.isJoinAllowed()) {
        joinAllowed = false;
      }

      // user가 해당 강의 튜터인 경우
      if (String(userID) == String(targetClass.tutor)) {
        console.log("요청하는사람이 이미 튜터임");
        joinAllowed = false;
      }

      // user가 이미 해당 강의 튜티인 경우
      for (let tuteeID of targetClass.tutees) {
        if (String(userID) == String(tuteeID)) {
          console.log("이미 수강중입니다.");
          joinAllowed = false;
        }
      }

      //포인트 없으면 수강신청 못함
      if (user.point < targetClass.price) {
        console.log("포인트가 부족합니다.");
        joinAllowed = false;
      }

      if (joinAllowed) {
        //아직 수강하지 않은경우 -> 수강할 수 있음
        console.log("수강신청완료");

        targetClass.tutees.push(userID);
        targetClass.save();

        //포인트차감
        user.point = user.point - targetClass.price;
        user.classesAsTutee.push(targetClass._id);
        user.save();

        res.redirect("/");
      } else {
        //강의가 참여할 수 없는 상태//내가 그 강의의 튜터인 경우//이미 수강중인경우//강의가 정원 초과한경우//포인트가 부족한경우

        console.log("수강신청에 실패했습니다.");
        res.send("fail");
        return;
      }
    });
  });
});

// -------------------------- 강의검색 & 수요 집계 --------------------------

classRouter.post("/search", function (req, res) {
  // 검색 키워드
  var userSearch = req.body.search;
  // 검색 결과를 저장할 배열
  var searchingArr = [];
  // 중복 여부를 위한 변수
  var alreadyInDB = false;
  var sortedArr;
  var today = new Date();
  
  
  // 모든 Class 조회
  Class.find({}, "className tutor", (err, found) => {
    if (err) {
      res.send("fail");
    }
    // 찾은 모든 Class에 대해 키워드를 갖고있는 지 확인
    found.forEach(function (element) {
      if (element.className.indexOf(userSearch) != -1) {
        searchingArr.push(element);
      }
    });

    // 검색 결과 존재
    if (searchingArr.length > 0) {
      res.send(searchingArr);
      
    } else if (searchingArr.length == 0) {
      //검색결과 존재 안함
      // res.send(searchingArr);

      // 수요집계 DB 모두 조회
      LectureDemand.find({}, "lecture count", (err, demand) => {
        if (err) {
          res.send("fail");
          console.log(err);
        }

        // DB가 비어있을 경우저장 (비어있으면 에러남)
        if (demand.length == 0) {
          var lectureSearch = new LectureDemand({
            lecture: userSearch,
            count: 1,
            date: today.toLocaleDateString()
          });

          lectureSearch.save(function (err) {
            if (err) {
              res.send("fail");
              return err;
            }
          });
          res.send(searchingArr);
          console.log("강의명 : " + userSearch + " - 수요 집계 DB에 저장됨");
          alreadyInDB = true;
        } else {
          // 수요집계 DB에 있는 모든 lecture에 대해 키워드 갖고있는지 확인
          demand.forEach(function (element) {
            if (
              element.lecture.indexOf(userSearch) != -1 ||
              userSearch.includes(element.lecture) == 1 &&
              element.date == today.toLocaleDateString()
            ) {
              element.count++;
              console.log("날짜 : " +today.toLocaleDateString()+ " 강의명 : " + userSearch + " - 수요 1 증가");
              element.save();
              alreadyInDB = true;
              res.send(searchingArr);
            }
          });
        }

        // 위에서 아무작업도 거치지 않았을 경우
        if (alreadyInDB == false) {
          var lectureSearch = new LectureDemand({
            lecture: userSearch,
            count: 1,
            date: today.toLocaleDateString()
          });

          lectureSearch.save(function (err) {
            if (err) {
              res.send("fail");
              return err;
            }
            console.log("강의명 : " + userSearch + " - 수요 집계 DB에 저장됨");
            res.send(searchingArr);
          });
        }
      });
      // 정렬
      setTimeout(sort, 1700);
    }
  });
  
  // 정렬 함수
  function sort() {
    LectureDemand.sorting((err, sort) => {
      if (err) {
        console.log(err);
      }
      sortedArr = sort;
      console.log(sortedArr);
    });
  }


});
module.exports = classRouter;
