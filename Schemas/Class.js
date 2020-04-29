var mongoose = require("mongoose");
var ClassBasicInfo = require("./ClassBasicInfo");
var LectureNote = require("./LectureNote");
var QnA = require("./QnA");
var Course = require("./Course");
var LectureTime = require("./LectureTime");
var Participation = require("./Participation");

const ClassStateManager = require("../Controller/ClassStateManager");
const DataManager = require("../Controller/DataManager");
const ClassConst = require("../Const/Class")

//TODO Participation -> AttendanceSchema 이름변경할것
const Attendance = new mongoose.model("Attendance", Participation)

const ClassSchema = new mongoose.Schema({
  //튜터 : User
  state: {
    type: String,
    enum: ["Prepare", "Joinable", "InProgress", "Ended"],
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  //튜티
  tutees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  //강의 타입
  classType: {
    type: String,
    enum: [
      "RealtimeOnlineCourseType",
      "OnlineCourseType",
      "QnAType",
      "OfflineType",
    ],
  },

  //카테고리 ex)컴퓨터공학
  category: {
    type: String,
    enum: ["컴퓨터공학", "수학", "영어"],
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
    default: Date.now,
  },

  //--------------------------------------------------------------------------
  //강의실 홈에 보여질 내용 (성적인증, 소개글, 수업시간)
  basicInfo: ClassBasicInfo,
  //강의노트
  lectureNotes: [LectureNote],
  //출결확인
  participations: [Participation],
  //질의응답
  qnas: [QnA],

  // Not Required
  //스카이프 링크 - 커리큘럼 온라인 실시간
  skypeLink: String,
  //실시간 채팅방 - 질의응답형
  chattingRoom: String,
  //강의 링크 - 커리큘럼 온라인
  courses: [Course],
  //수업시간
  lectureTimes: [LectureTime],
  //수업에 참여할 수 있는 최대 튜티수
  maxTutee: Number,
  //수업장소 (Only OfflineType)
  place: String,
});
/*
    스키마 -> 모델 -> 다큐먼트
*/

//Class 다큐먼트가 호출하는 메서드
ClassSchema.methods.isJoinAllowed = function () {
  if (this.state == "Joinable") {
    if (this.maxTutee) {
      if (this.tutees.length < this.maxTutee) {
        return true;
      } else {
        console.log("강의의 정원이 초과되서 참여 할 수 없습니다.");
        return false;
      }
    } else {
      return true;
    }
  } else {
    console.log("강의가 open되지 않았거나 이미 진행중입니다.");
    return false;
  }
};

ClassSchema.methods.addClassData = function (targetDataType, Data, Callback) {
  if (ClassConst.isAccessible(targetDataType, this.classType)) {
    //다큐먼트에 데이터 추가 추가.
    DataManager.addClassDataByDataType(targetDataType, this, Data, Callback);
    ClassStateManager.checkPrepared(Class);
  } else {
    Callback("이 클래스에는 " + targetDataType + "을 추가 할 수 없습니다.");
  }
};

//Class 모델이 호출하는 메서드
ClassSchema.statics.addClassData = async function (
  targetDataType,
  targetClassID,
  Data,
  Callback
) {
  //ClassID로 다큐먼트 찾아서
  await this.findById(targetClassID, (err, found) => {
    if (err) {
      return Callback(err);
    }
    //다큐먼트에 데이터 추가 추가.
    if (ClassConst.isAccessible(targetDataType, found.classType)) {
      DataManager.addClassDataByDataType(targetDataType, found, Data, Callback);
    } else {
      Callback("이 클래스에는 " + targetDataType + "을 추가 할 수 없습니다.");
    }
  });
};

ClassSchema.statics.generateAttendance = function (targetClassID, Callback) {
  // <출석 객체 생성 메서드>
  // 1. 해당 ClassID로 Class 찾기
  // 2. 지금 == 수업시간 ? 수업 진행가능한지?

  this.findById(targetClassID, (err, found) => {
    if (err) {
      return Callback(err);
    }
    if (isOnTime(found) && ClassStateManager.isClassOpenable(found)) {
      //지금이 해당 Class의 수업시간 + Class 상태가 수업 시작 가능상태면 시작 요청

      //TODO 출석객체 이미 있을때 대응하기
      DataManager.generateAttendanceByClassType(found, Callback);
    } else {
      Callback(found.className + '의 수업시간이 아닙니다.', null)
    }
  });
};

ClassSchema.statics.attendance = function (targetClassID, auth, tuteeID, Callback) {
  // <튜티 출석하기 메서드>
  // 1. 해당 ClassID로 Class 찾기
  // 2. 클래스타입별 출석 메서드 호출
  this.findById(targetClassID, (err, found) => {
    if (err) {
      return Callback(err);
    }
    DataManager.attendByClassType(found, auth, tuteeID, Callback);
  });
};

function isOnTime(Class){
  //지금이 해당 Class의 수업시간이면 true 리턴
  const DAY = {
    'Mon' : 1, 'Tue' : 2, 'Wed' : 3, 'Thu' : 4, 'Fri' : 5, 'Sat' : 6, 'Sun' : 0
  }
  let Now = new Date();
  let startTime = new Date()
  let finishTime = new Date()

  for(let LectureTime of Class.lectureTimes){
    startTime.setHours(String(LectureTime.start).substring(0,2), String(LectureTime.start).substring(2,4), 0, 0)
    finishTime.setHours(String(LectureTime.finish).substring(0,2), String(LectureTime.finish).substring(2,4), 0, 0)

    if(DAY[LectureTime.day] == Now.getDay() &&
      Now.getTime() > startTime.getTime() && 
      Now.getTime() < finishTime.getTime()){
        // 지금이 수업시간이 맞다면 true
        return true;
    }
  }
  return false;
}

const Class = mongoose.model("Class", ClassSchema);

module.exports = Class;
