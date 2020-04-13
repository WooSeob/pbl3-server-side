var mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    //튜터 : User
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
    //성적인증
    grade: String,

    //튜터 하고싶은말
    description: String,

    //수업시간
    lectureTime: {
        startAt: Date,
        duration: Number
    },

    //커리큘럼
    course: [
        {
            type: String
        }
    ],
    
    //강의노트
    lectureNote: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LectureNote"
        }
    ],

    //출결확인
    participation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participation"
    },

    //질의응답
    qna: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QnA"
        }
    ],


    // Not Required
    //스카이프 링크 - 커리큘럼 온라인 실시간
    skypeLink: String,

    //강의 링크 - 커리큘럼 온라인
    course:[
        {
            description: String,
            link: String
        }
    ],

    //실시간 채팅방 - 질의응답형
    chattingRoom: String
});

const Class = mongoose.model("Class", ClassSchema);

module.exports = Class;