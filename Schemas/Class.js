var mongoose = require('mongoose');
var ClassBasicInfo = require('./ClassBasicInfo')
var LectureNote = require('./LectureNote')
var QnA = require('./QnA');
var Course = require('./Course');
var LectureTime = require('./LectureTime');

var ClassStateManager = require('../Controller/ClassStateManager')
var ClassDataChecker = require('../Controller/DataChecker')

const ParticipationSchema = new mongoose.Schema({
    
});

const ClassSchema = new mongoose.Schema({
    //튜터 : User
    state: {
        type: String,
        enum: ['Prepare', 'Joinable', 'InProgress', 'Ended']
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    //튜티
    tutees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    //강의 타입
    classType: {
        type: String,
        enum: ['RealtimeOnlineCourseType', 'OnlineCourseType', 'QnAType', 'OfflineType']
    },

    //카테고리 ex)컴퓨터공학
    category: {
        type: String,
        enum: ['컴퓨터공학', '수학', '영어']
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
        default: Date.now
    },

    //--------------------------------------------------------------------------
    //강의실 홈에 보여질 내용 (성적인증, 소개글, 수업시간)
    basicInfo: ClassBasicInfo,
    //강의노트
    lectureNote: [LectureNote],
    //출결확인
    participation: ParticipationSchema,
    //질의응답
    qna: [QnA],

    // Not Required
    //스카이프 링크 - 커리큘럼 온라인 실시간
    skypeLink: String,
    //실시간 채팅방 - 질의응답형
    chattingRoom: String,
    //강의 링크 - 커리큘럼 온라인
    course:[Course],
    //수업시간
    lectureTime: [LectureTime],
    //수업에 참여할 수 있는 최대 튜티수
    maxTutee: Number,
    //수업장소 (Only OfflineType)
    place: String
});
/*
    스키마 -> 모델 -> 다큐먼트
*/

/*
    Class 다큐먼트가 호출하는 메서드
*/
ClassSchema.methods.isJoinAllowed = function(){
    if(this.state == 'Joinable'){
        if(this.maxTutee){
            if(this.tutees.length < this.maxTutee){
                return true
            }else{
                console.log('강의의 정원이 초과되서 참여 할 수 없습니다.')
                return false
            }
        }else{
            return true
        }
    }else{
        console.log('강의가 open되지 않았거나 이미 진행중입니다.')
        return false
    }
};

ClassSchema.methods.addClassData = function(targetDataType, Data, Callback){
    if(ClassDataChecker.isAccessible(targetDataType, this.classType)){
        //다큐먼트에 데이터 추가 추가.
        addClassDataByClassType(targetDataType, this, Data)
    }else{
        Callback('이 클래스에는 ' + targetDataType + '을 추가 할 수 없습니다.');
    }
}

/*
    Class 모델이 호출하는 메서드
*/
ClassSchema.statics.addClassData = function(targetDataType, targetClassID, Data, Callback){
    //ClassID로 다큐먼트 찾아서
    this.findById(targetClassID, (err, found)=>{
        if(err){callback(err);return}
        //다큐먼트에 데이터 추가 추가.  
        if(ClassDataChecker.isAccessible(targetDataType, found.classType)){
            addClassDataByClassType(targetDataType, found, Data)
        }else{
            Callback('이 클래스에는 ' + targetDataType + '을 추가 할 수 없습니다.');
        }
    })
}

function addClassDataByClassType(dataType, Class, Data){
    ClassDataChecker.ADD_FUNCTIONS_FOR_TYPE[dataType](Class, Data)
    ClassStateManager.checkPrepared(Class)
}


const Class = mongoose.model("Class", ClassSchema);

module.exports = Class;