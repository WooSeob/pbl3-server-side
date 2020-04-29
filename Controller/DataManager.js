const LogString = 'DataManager.js : '
var mongoose = require("mongoose");
const ClassStateManager = require("./ClassStateManager");

const AttendanceSchema = require("../Schemas/Participation");
const Attendance = new mongoose.model("Attendance", AttendanceSchema)

//데이터 타입별 저장방법
const ADD_FUNCTIONS_BY_DATATYPE = {
    'BasicInfo': async function(Class, Data, Callback){
        Class.basicInfo = Data;
        await Class.save(()=>{
            console.log('기본정보 추가성공')
            ClassStateManager.checkPrepared(Class);
            return Callback(null)
        });
    },
    'Course': async function(Class, Data, Callback){
        Class.courses.push(Data);
        if(Class.classType == 'OnlineCourseType'){
            //TODO 동영상 강의형의 경우 동영상강의가 추가될 때 출석객체도 생성해서 추가해준다.
            let newAttendance = new Attendance({
                courseID: Data._id
            })
            Class.participations.push(newAttendance)
        }
        await Class.save(()=>{
            console.log('커리큘럼 추가성공')
            ClassStateManager.checkPrepared(Class);
            
            return Callback(null)
        });
    },
    'LectureTime': async function(Class, Data, Callback){
        Class.lectureTimes.push(Data);
        await Class.save(()=>{
            console.log('강의시간 추가성공')
            ClassStateManager.checkPrepared(Class);
            return Callback(null)
        });
    },
    'MaxTutee': async function(Class, Data, Callback){
        Class.maxTutee = Data;
        await Class.save(()=>{
            console.log('최대 튜티 수 추가성공')
            ClassStateManager.checkPrepared(Class);
            return Callback(null)
        });
    },
    'Place': async function(Class, Data, Callback){
        Class.place = Data;
        await Class.save(()=>{
            console.log('수업장소 추가성공')
            ClassStateManager.checkPrepared(Class);
            return Callback(null)
        });
    },
    'SkypeLink': async function(Class, Data, Callback){
        Class.skypeLink = Data;
        await Class.save(()=>{
            console.log('스카이프링크 추가성공')
            return Callback(null)
        });
    },
    'Question': async function(Class, Data, Callback){
        Class.qnas.push(Data)
        await Class.save(()=>{
            console.log('질문 추가성공')
            return Callback(null)
        });
    },
    'Answer': async function(Class, Data, Callback){
        //답변 달기           
        let targetQuestion = Class.qnas.id(Data.target)
        if(!targetQuestion){return Callback(Data.target + '에 해당하는 질문이 없습니다.')}

        Class.qnas.id(Data.target).answer = {
            content: Data.content
        }
        await Class.save(()=>{
            console.log('답변 추가성공')
            return Callback(null)
        });
    },
    'LectureNote': async function(Class, Data, Callback){
        Class.lectureNostes.push(Data)
        await Class.save(()=>{
            console.log('질문 추가성공')
            return Callback(null)
        });
    },
    'Attendance': async function(Class, Data, Callback){
        Class.participations.push(Data)
        await Class.save(()=>{
            console.log('수업객체 저장 성공')
            return Callback(null)
        });
    }
}


const ATTEND_FUNCTION_BY_AUTH_NUMBER = async function(Class, auth, tuteeID, Callback){
    //수업.가장최근.인증번호 == 요청번호 && 수업.가장최근.생성일 + 3분 > 지금
    //수업.가장최근.tutees.push(userID)
    let Now = new Date()
    let latestAttendance = Class.participations.pop()

    const TIME_OUT = 3 * 60 * 1000 // 3m * 60s * 1000ms => 3분
    
    if (latestAttendance.authNumber == auth){
        if(Now.getTime() < latestAttendance.startTime.getTime() + TIME_OUT){
            latestAttendance.tutees.push(tuteeID)
            Class.participations.push(latestAttendance)                
            await Class.save(()=>{
                console.log(Class._id + '수업 ' + tuteeID + ' 출석 완료')
                return Callback(null)
            })
        }else{
            return Callback('제한 시간이 지났습니다.')
        }
    } else{
        return Callback('인증 번호가 틀렸습니다.')
    }
}

//수업 타입별 출석방법
const ATTEND_FUNCTIONS_BY_CLASS_TYPE = {
    //커리큘럼 온라인 실시간형의 출석방법
    'RealtimeOnlineCourseType': ATTEND_FUNCTION_BY_AUTH_NUMBER,
    //동영상 강의형의 출석방법
    'OnlineCourseType': async function(Class, auth, tuteeID, Callback){
        //해당 동영상 ID에 해당하는 Attendance.tutees.push(tuteeID)
        let hasSeen = false;
        for(let attendance of Class.participations){
            if(attendance.courseID == auth){
                if(!attendance.tutees.includes(tuteeID)){
                    //안본 상태면 추가
                    attendance.tutees.push(tuteeID)
                    hasSeen = true;
                }
                await Class.save((err)=>{
                    if(err){return Callback(err)}
                    if(hasSeen){
                        console.log(Class._id + '수업 ' + tuteeID + ' 봤어요 처리')
                        return Callback(null)
                    }else{
                        return Callback('이미 시청한 동영상입니다.')
                    }
                })
                return;
            }
        }
        return Callback(auth + ' 해당 강의를 찾지 못했습니다.')
    },
    //질의응답형의 출석방법
    'QnAType': async function(Class, auth, tuteeID, Callback){
        let isJoined = false;
        let latestAttendance = Class.participations.pop()
        
        if(!latestAttendance.tutees.includes(tuteeID)){
            isJoined = true
            latestAttendance.tutees.push(tuteeID)
        }
        
        Class.participations.push(latestAttendance)                
        await Class.save(()=>{
            if(isJoined){
                console.log(Class._id + '수업 ' + tuteeID + ' 출석 완료')
                return Callback(null)
            }else{
                return Callback('이미 출석한 유저입니다.')
            }
        })

    },
    //오프라인형의 출석방법
    'OfflineType': ATTEND_FUNCTION_BY_AUTH_NUMBER
}


//수업 타입별 출석 객체 생성
//TODO 이미 출석 요청 했는데 또 한 경우 대응하기
const GENERATE_ATTENDANCE_FUNCTIONS_BY_CLASS_TYPE = {
    //커리큘럼 온라인 실시간형의 출석방법
    'RealtimeOnlineCourseType': function(Class, Callback){
        //인증번호 생성
        let authNumber = Math.floor(Math.random() * (9999-1000)) + 1000
        let newAttendance = new Attendance({
            authNumber: authNumber
        })
        Class.participations.push(newAttendance)
        Class.save(()=>{
            console.log('출석 객체 저장, 인증번호 : ' + newAttendance)
            Callback(null, newAttendance.authNumber);
        });
    },
    //동영상 강의형의 출석방법
    'OnlineCourseType': function(Class, Callback){
        //커리큘럼 추가할 때 생성
        Callback('동영상 강의형 수업은 출석 요청에 반응하지 않습니다.', null)
    },
    //질의응답형의 출석방법
    'QnAType': function(Class, Callback){
        //채팅방 생성
        //TODO 채팅방 생성하기
        let newChattingRoom = 'http://localhost:3000/'
        //출석 객체 생성
        let newAttendance = new Attendance()

        //채팅방 주소 저장
        Class.chattingRoom = newChattingRoom
        //출석 객체 저장
        Class.participations.push(newAttendance)
        Class.save(()=>{
            console.log('출석 객체, 채팅방 주소 저장, 채팅방 주소 : ' + newChattingRoom)
            Callback(null, newChattingRoom);
        })
    },
    //오프라인형의 출석방법
    'OfflineType': function(Class, Callback){
        //인증번호 생성
        let authNumber = Math.floor(Math.random() * (9999-1000)) + 1000
        let newAttendance = new Attendance({
            authNumber: authNumber
        })
        Class.participations.push(newAttendance)
        Class.save(()=>{
            console.log('출석 객체 저장, 인증번호 : ' + newAttendance)
            Callback(null, newAttendance.authNumber);
        });
    }
}

const DataManager = {
    //데이터 타입에 따라 수업정보 추가
    addClassDataByDataType: function(dataType, Class, Data, Callback) {
        ADD_FUNCTIONS_BY_DATATYPE[dataType](Class, Data, Callback);
    },
    //클래스 타입에 따라 출석객체 생성
    generateAttendanceByClassType: function(Class, Callback) {
        GENERATE_ATTENDANCE_FUNCTIONS_BY_CLASS_TYPE[Class.classType](Class, Callback);
    },
    //클래스 타입에 따라 출석
    attendByClassType: function(Class, auth, tuteeID, Callback) {
        ATTEND_FUNCTIONS_BY_CLASS_TYPE[Class.classType](Class, auth, tuteeID, Callback);
    },
}

module.exports = DataManager
