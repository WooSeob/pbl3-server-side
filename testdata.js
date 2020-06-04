var mongoose = require("mongoose");
var User = require("./Schemas/User");
var Class = require("./Schemas/Class");
var Category = mongoose.model("Category", require("./Schemas/Category"));

var ClassConst = require("./Const/Class");

var QnASchema = require("./Schemas/QnA");
var ClassBasicInfoSchema = require("./Schemas/ClassBasicInfo");
var CourseSchema = require("./Schemas/Course");
var LectureTimeSchema = require("./Schemas/LectureTime");
var LectureNoteSchema = require("./Schemas/LectureNote");
var AttendanceSchema = require("./Schemas/Participation");

const QnA = mongoose.model("QnA", QnASchema);
const Course = mongoose.model("Course", CourseSchema);
const ClassBasicInfo = mongoose.model("ClassBasicInfo", ClassBasicInfoSchema);
const LectureTime = mongoose.model("LectureTime", LectureTimeSchema);
const LectureNote = mongoose.model("LectureNote", LectureNoteSchema);
const Attendance = mongoose.model("Attendance", AttendanceSchema);

//입력 관리
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


const TIME_ALLDAY = [
  {
    day: "Mon",
    finish:  "2359",
    start:  "0000"
  },
  {
    day: "Tue",
    finish:  "2359",
    start:  "0000"
  },
  {
    day: "Wed",
    finish:  "2359",
    start:  "0000"
  },
  {
    day: "Thu",
    finish:  "2359",
    start:  "0000"
  },
  {
    day: "Fri",
    finish:  "2359",
    start:  "0000"
  },
  {
    day: "Sat",
    finish:  "2359",
    start:  "0000"
  },
  {
    day: "Sun",
    finish:  "2359",
    start:  "0000"
  }
]

let additionalDataByTypes = {
  RealtimeOnlineCourseType: (data) => {
    //기본정보
    data.class_description = "자동 생성된 테스트 데이터 입니다.";
    data.grade = "성적인증URL";
    //커리큘럼
    data.course_description = "커리큘럼";
    //최대튜티수
    data.maxTutee = 3;
    //강의시간
    data.lectureTimes =TIME_ALLDAY
  },
  OnlineCourseType: (data) => {
    //기본정보
    data.class_description = "자동 생성된 테스트 데이터 입니다.";
    data.grade = "성적인증URL";
  },
  QnAType: (data) => {
    //기본정보
    data.class_description = "자동 생성된 테스트 데이터 입니다.";
    data.grade = "성적인증URL";

    //강의시간
    data.lectureTimes = TIME_ALLDAY
  },
  OfflineType: (data) => {
    //기본정보
    data.class_description = "자동 생성된 테스트 데이터 입니다.";
    data.grade = "성적인증URL";
    //최대튜티수
    data.maxTutee = 3;
    //강의시간
    data.lectureTimes = TIME_ALLDAY
    //강의장소
    data.place = "황소갈매기";
  },
};

let types = [
  "RealtimeOnlineCourseType",
  "OnlineCourseType",
  "QnAType",
  "OfflineType",
];

async function mainlogic() {
  let newUser = makeUser(1);
  console.log(newUser + "\n테스트 유저 생성 성공");

  let selectedType;
  let classCount = 1;
  let userCount = 2;
  console.log("\n----------------------------");
  console.log(
    "생성하고자 하는 강의 타입\n1. 실시간 온라인\n2. 동영상 강의형\n3. 질의응답형\n4. 오프라인형\n5. DB모두삭제\n6. 유저생성\n7. 종료\n"
  );
  for await (const type of rl) {
    if (type === "5") {
      await resetDB();
      console.log("\n----------------------------");
      console.log(
        "생성하고자 하는 강의 타입\n1. 실시간 온라인\n2. 동영상 강의형\n3. 질의응답형\n4. 오프라인형\n5. DB모두삭제\n6. 유저생성\n7. 종료\n"
      );
      newUser = null;
      classCount = 1;
      userCount = 2;
      continue;
    } else if (type === "6") {
      let newUser = await makeUser(userCount++);
      console.log(newUser + "\n테스트 유저 생성 성공");
      console.log("\n----------------------------");
      console.log(
        "생성하고자 하는 강의 타입\n1. 실시간 온라인\n2. 동영상 강의형\n3. 질의응답형\n4. 오프라인형\n5. DB모두삭제\n6. 유저생성\n7. 종료\n"
      );
      continue;
    } else if (type === "7") {
      process.exit();
    } else if (type === "8") {
      //카테고리 생성
      // makeCategory("MAJOR", "컴퓨터", ["컴퓨터구조", "알고리즘", "자료구조"])
      // makeCategory("MAJOR", "전기전자제어공학", ["전전제 과목1", "전전제 과목2"])
      // makeCategory("MAJOR", "기계공학과", ["기공 과목1", "기공 과목2"])
      // makeCategory("MAJOR", "화학공학과", ["화공 과목1", "화공 과목2"])

    }else if (type === "9") {
      //카테고리 생성
      // makeCategory("INTERESTS", "스포츠", ["축구", "농구", "야구"])
      // makeCategory("INTERESTS", "원예", ["꽃꽃이", "플라워 공예"])

    }else if (type === "10") {
      //CategoryManager 테스트
      let cm = require("./Controller/CategoryManager")

      // console.log(await cm.Major.get());
      // console.log(await cm.Interests.get());
      // console.log(await cm.Major.getSubItems("컴퓨터공학"))
      // console.log(await cm.Interests.getSubItems("스포츠"))
      cm.Major.addCategory("기계공학")
      //cm.Major.addCategory("전기전자제어공학")

      // cm.test.exCompare("한경한경컴퓨터공학과", "컴공")
      // cm.test.exCompare("전기전자제어공학과", "전전제")
      // cm.test.exCompare("전기전자제어공학과", "전정제")

    } else {
      if (!newUser) {
        newUser = await makeUser(1);
        console.log(newUser + "\n테스트 유저 생성 성공");
      }

      selectedType = types[type - 1];

      console.log(`${selectedType} 선택 됐습니다.`);

      let data = {
        classType: selectedType,
        category: "컴퓨터공학",
        studyAbout: "수업 과목",
        className: "테스트" + classCount++,
        price: 10,
      };

      //타입별 데이터세팅
      additionalDataByTypes[selectedType](data);
      //생성
      makeClass(data, "test1");

      console.log("\n----------------------------");
      console.log(
        "생성하고자 하는 강의 타입\n1. 실시간 온라인\n2. 동영상 강의형\n3. 질의응답형\n4. 오프라인형\n5. DB모두삭제\n6. 유저생성\n7. 종료\n"
      );
    }
  }
}

// DB 연결
mongoose.connect("mongodb://localhost:27017/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error);
db.once("open", function () {
  console.log("Connection to mongoDB");
});

mainlogic();

async function makeCategory(type, name, subItems){
  // let newCategory = await Category.create({
  //   type: type,
  //   name: name,
  //   subItems: subItems
  // })
  // return newCategory
}

async function makeUser(num) {
  newUser = await User.create({
    id: "test" + num,
    password: "asdf",
    nickname: "테스트유저" + num,
    major: "컴퓨터공학",
    point: 10000000,
    classesAsTutee: [],
    classesAsTutor: [],
  });
  return newUser;
}

async function resetDB() {
  await db.dropCollection("classes", async function (err, result) {
    await console.log("클래스 삭제");

    db.dropCollection("users", async function (err, result) {
      await console.log("유저 삭제");

      db.dropCollection("mails", async function (err, result) {
        await console.log("메일 삭제");

        db.dropCollection("sessions", async function (err, result) {
          await console.log("세션 삭제");

          db.dropCollection("chatlogs", async function (err, result) {
            await console.log("채팅로그 삭제");
            console.log("모두 삭제됐습니다.");
          });
        });
      });
    });
  });
}

async function makeClass(data, userID) {
  //기본적으로 강의개설직후는 '준비중' 상태
  await User.findOne({ id: userID }, async (err, tutor) => {
    if (err) {
      res.send("fail");
      return;
    }

    console.log("\n|----------- 강의개설 ------------");
    console.log("| 강 의 명 : " + data.className);
    console.log("| 강의타입 : " + data.classType);

    //기본적으로 강의개설직후는 '준비중' 상태
    var newClass = new Class({
      classType: data.classType,
      category: data.category,
      studyAbout: data.studyAbout,
      className: data.className,
      price: data.price,
      tutor: tutor._id,
      state: ClassConst.state.PREPARE,
    });

    //기본정보
    if (data.grade && data.class_description) {
      let basicInfo = new ClassBasicInfo({
        grade: data.grade,
        description: data.class_description,
      });
      await newClass.addClassData("BasicInfo", basicInfo, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //커리큘럼 데이터 있으면 추가
    if (data.course_description) {
      newCourse = new Course({
        description: data.course_description,
      });
      await newClass.addClassData("Course", newCourse, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //강의시간 데이터 있으면 추가
    if (data.lectureTimes) {
      let Times = new Array();
      for(let lectureTime of data.lectureTimes){
        Times.push(new LectureTime(lectureTime))
      }

      await newClass.addClassData("LectureTime", Times, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //최대튜티수 데이터 있으면 추가
    if (data.maxTutee) {
      await newClass.addClassData("MaxTutee", data.maxTutee, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //스카이프링크 데이터 있으면 추가
    if (data.skypeLink) {
      await newClass.addClassData("SkypeLink", data.skypeLink, (errmsg) => {
        if (errmsg) {
          return console.log(errmsg);
        }
      });
    }

    //수업장소 데이터 있으면 추가
    if (data.place) {
      await newClass.addClassData("Place", data.place, (errmsg) => {
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
    } else {
      console.log("클라이언트 응답 : fail");
      console.log(
        newClass.classType + "타입에 필요한 정보가 모두 채워지지 않았습니다."
      );
    }
  });
}
