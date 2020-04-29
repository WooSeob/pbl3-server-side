var express = require('express');
var mongoose = require('mongoose');
var Class = require('../Schemas/Class');
var User = require('../Schemas/User');

const ClassConst = require('../Const/Class')
const ClassStateManager = require('../Controller/ClassStateManager')
const ClassDataChecker = require('../Controller/DataManager')

var QnASchema = require('../Schemas/QnA')
var ClassBasicInfoSchema = require('../Schemas/ClassBasicInfo')
var CourseSchema = require('../Schemas/Course')
var LectureTimeSchema = require('../Schemas/LectureTime')
var LectureNoteSchema = require('../Schemas/LectureNote')
var AttendanceSchema = require('../Schemas/Participation')

const QnA = mongoose.model("QnA", QnASchema);
const Course = mongoose.model("Course", CourseSchema);
const ClassBasicInfo = mongoose.model("ClassBasicInfo", ClassBasicInfoSchema);
const LectureTime = mongoose.model("LectureTime", LectureTimeSchema);
const LectureNote = mongoose.model("LectureNote", LectureNoteSchema);
const Attendance = mongoose.model("Attendance", AttendanceSchema);

var classRouter = express.Router();

/*
    1. 공통정보 CRUD
        1. Class.basicInfo
            1. 성적인증 이미지 url 
            2. 수업소개

    2. 수업타입별 데이터 CRUD
        1. 커리큘럼 온라인 실시간
            1. 정보
                1. 강의시간 V
                2. 커리큘럼 V
                3. 최대 튜티수 V
            2. 기능
                1. 질의응답
                2. 수업노트
                3. 출결관리
                4. 스카이프 링크 ##

        2. 커리큘럼 온라인 실시간X
            1. 정보
                1. 커리큘럼(링크 포함) V
            2. 기능
                1. 질의응답
                2. 출결관리(진도율)
                3. 강의시청(링크) ##

        3. 질의응답형
            1. 정보
                1. 강의시간 V
            2. 기능
                1. 질의응답
                2. 실시간 채팅방 ##

        4. 오프라인형
            1. 정보
                1. 강의시간 V
                2. 커리큘럼 V
                3. 최대 튜티수 V
            2. 기능
                1. 질의응답
                2. 수업노트
                3. 출결관리

        1. 기능 라우팅
            1. 강의시간 V
            2. 커리큘럼 V
            3. 최대 튜티수 V

            4. 질의응답 V
            5. 수업노트 V
            6. 출결관리 V

            7. 스카이프링크
            8. 동영상링크 
            9. 실시간채팅방  
*/

//수업생성
//TODO api문서 성공시 실패시에 대한 부분 업데이트 할것
classRouter.post('/', function(req, res){
    //튜터 아이디로 수업 생성
    User.findById(req.session.uid, (err,tutor)=>{
        if(err){ res.send('fail'); return; }

        console.log('|----------- 강의개설 ------------')
        console.log('| 강 의 명 : ' + req.body.className)
        console.log('| 강의타입 : ' + req.body.classType)

        //기본적으로 강의개설직후는 '준비중' 상태
        var newClass = new Class({
            classType: req.body.classType,
            category: req.body.category,
            studyAbout: req.body.studyAbout,
            className: req.body.className,
            price: req.body.price,
            tutor: tutor._id,
            state: ClassConst.state.PREPARE
        });

        newClass.save(()=>{
            let isSuccess = false;
            
            //기본정보
            if(req.body.grade && req.body.class_description){
                let basicInfo = new ClassBasicInfo({
                    grade: req.body.grade,
                    description: req.body.class_description
                })
                // TaskQueue.push({
                //     type: 'BasicInfo',
                //     data: basicInfo
                // })
                console.log('기본정보 추가 호출')

                newClass.addClassData('BasicInfo', basicInfo, (errmsg)=>{
                    if(errmsg){return console.log(errmsg)}
                    isSuccess = true;
                })
            }

            //커리큘럼 데이터 있으면 추가
            if(req.body.course_description){
                newCourse = new Course({
                    description: req.body.course_description,
                })
                // TaskQueue.push({
                //     type: 'Course',
                //     data: newCourse
                // })
                console.log('커리큘럼 추가 호출')

                newClass.addClassData('Course', newCourse, (errmsg)=>{
                    if(errmsg){return console.log(errmsg)}
                    isSuccess = true;
                })
            }
            
            //강의시간 데이터 있으면 추가
            if(req.body.time_day && req.body.time_start && req.body.time_finish){
                newTime = new LectureTime({
                    day: req.body.time_day,
                    start: req.body.time_start,
                    finish: req.body.time_finish
                })
                // TaskQueue.push({
                //     type: 'LectureTime',
                //     data: newTime
                // })
                console.log('강의시간 추가 호출')

                newClass.addClassData('LectureTime', newTime, (errmsg)=>{
                    if(errmsg){return console.log(errmsg)}
                    isSuccess = true;
                })
            }

            //최대튜티수 데이터 있으면 추가
            if(req.body.maxTutee){
                // TaskQueue.push({
                //     type: 'MaxTutee',
                //     data: req.body.maxTutee
                // })
                console.log('최대튜티수 추가 호출')
                newClass.addClassData('MaxTutee', req.body.maxTutee, (errmsg)=>{
                    if(errmsg){return console.log(errmsg)}
                    isSuccess = true;
                })
            }

            //스카이프링크 데이터 있으면 추가
            if(req.body.skypeLink){
                // TaskQueue.push({
                //     type: 'SkypeLink',
                //     data: req.body.skypeLink
                // })
                console.log('스카이프링크 추가 호출')

                newClass.addClassData('SkypeLink', req.body.skypeLink, (errmsg)=>{
                    if(errmsg){return console.log(errmsg)}
                    isSuccess = true;
                })
            }
            
            //수업장소 데이터 있으면 추가
            if(req.body.place){
                // TaskQueue.push({
                //     type: 'Place',
                //     data: req.body.place
                // })
                console.log('수업장소 추가 호출')

                newClass.addClassData('Place', req.body.place, (errmsg)=>{
                    if(errmsg){return console.log(errmsg)}
                    isSuccess = true;
                })
            }

            //이 강의를 개설한 유저의 classesAsTutor 항목에 이 강의 추가
            tutor.classesAsTutor.push(newClass._id);
            tutor.save(()=>{
                if(isSuccess){
                    console.log('클라이언트 응답 : ' + newClass._id)
                    res.send(newClass._id); 
                }else{
                    console.log('클라이언트 응답 : fail')
                    res.send('fail')
                }
                
            });
        });
    });
})


//수업명으로 수업 정보 받아오기
classRouter.get('/name/:name', function(req, res){
    let targetClassName = req.params.name;
    let query = {
        className: targetClassName
    };
    if(targetClassName == 'all'){query = null;}

    Class.find(query)
    .then((data)=>{
        res.send(data);
    })
    .catch((err)=>{
        console.log(err);
    })
});

//수업id로 정보 받아오기
classRouter.get('/:id', function(req, res){
    let targetClassID = req.params.id;
    Class.findById(targetClassID, (err, Class)=>{
        if(err){console.log(err);return res.send('fail')}
        res.send(Class);
    })
});

//------------------------------------    정보추가    ------------------------------------
//강의 기본정보 (성적인증이미지url, 소개글) 추가
classRouter.post('/:id/basic-info', (req, res)=>{
    let targetClassID = req.params.id;
    var info = new ClassBasicInfo({
        grade: req.body.grade,
        description: req.body.description
    })
    Class.findByIdAndUpdate(targetClassID, {basicInfo: info}, (err, found)=>{
        if(err){console.log(err); return res.send('fail')}
        ClassStateManager.checkPrepared(found)
        res.send(found);
    });
})

//강의 커리큘럼 추가
classRouter.post('/:id/course', (req, res)=>{
//@@@ 이 함수는 받아온 데이터로 course 만들어서 Class.course배열에 계속해서 집어넣는 함숩니다. 
    let targetClassID = req.params.id;
    let userID = req.session.uid
    var newCourse = new Course({
        description: req.body.description,
        link: req.body.link
    })

    User.isTutorOf(userID, targetClassID, ()=>{
        Class.addClassData('Course',targetClassID, newCourse, (errmsg)=>{
            if(errmsg){console.log(errmsg); return res.send('fail')}
            res.send('success')
        })
    })
})

//강의시간 추가
classRouter.post('/:id/lecture-time', (req, res)=>{
    //@@@ 이 함수는 받아온 데이터로 LectureTime 만들어서 Class.LectureTime배열에 계속해서 집어넣는 함숩니다. 
    let targetClassID = req.params.id;
    let userID = req.session.uid
    var newTime = new LectureTime({
        startAt: req.body.startAt,
        duration: req.body.duration
    })

    User.isTutorOf(userID, targetClassID, ()=>{
        Class.addClassData('LectureTime', targetClassID, newTime, (errmsg)=>{
            if(errmsg){console.log(errmsg); return res.send('fail')}
            res.send('success')
        })
    })
})

//최대 튜티수 추가
classRouter.post('/:id/max-tutee', (req, res)=>{
    //@@@ 이 함수는 Class.maxTutee에 받아온 데이터를 넣는 함숩니다.
    let targetClassID = req.params.id;
    let userID = req.session.uid
    let numMaxTutee = req.body.maxTutee;

    User.isTutorOf(userID, targetClassID, ()=>{
        Class.addClassData('MaxTutee' ,targetClassID, numMaxTutee, (errmsg)=>{
            if(errmsg){console.log(errmsg); return res.send('fail')}
            res.send('success')
        })
    })
})

//스카이프 링크 추가
classRouter.post('/:id/skype', (req, res)=>{
    //@@@ 이 함수는 Class.skypelink에 받아온 스카이프 링크를를 넣는 함숩니다.
    let targetClassID = req.params.id;
    let userID = req.session.uid
    let skypeLink = req.body.skypeLink;

    User.isTutorOf(userID, targetClassID, ()=>{
        Class.addClassData('SkypeLink', targetClassID, skypeLink, (errmsg)=>{
            if(errmsg){console.log(errmsg); return res.send('fail')}
            res.send('success')
        })
    })
})

//강의 시작
classRouter.get('/:id/start', (req, res)=>{
    let userID = req.session.uid
    let targetClassID = req.params.id;

    User.isTutorOf(userID, targetClassID, (err)=>{
        if(err){console.log(err); return res.send('fail')}

        Class.findById(targetClassID, (err, Class)=>{
            if(err){console.log(err); return res.send('fail')}
    
            ClassStateManager.startLecture(Class, (err)=>{
                if(err){console.log(err); return res.send('fail')}
                res.send('success')
            })
        })
    })
})

//------------------------------------    QnA    ------------------------------------
//QnA 질문 게시글 조회
classRouter.get('/:id/question', (req, res)=>{
    let targetClassID = req.params.id;

    Class.findById(targetClassID, (err, Class)=>{
        if(err){console.log(err);return res.send('fail')}
        console.log(Class)
        res.send(Class.qna);
    })
})

//QnA 질문 추가
classRouter.post('/:id/question', (req, res)=>{
    //질문은 해당 수업의 튜티가 한다.
    //그 수업의 상태는 수업진행중이어야 한다 ?
    let targetClassID = req.params.id;
    let content = req.body.content;
    let userID = req.session.uid

    User.isTuteeOf(userID, targetClassID, ()=>{
        //질문추가
        let newQuestion = QnA({
            question: {
                Writer: userID,
                content: content
            }
        });
        Class.addClassData('Question', targetClassID, newQuestion, (errmsg)=>{
            if(errmsg){console.log(errmsg); return res.send('fail')}
            res.send('success')
        })
    })
})
//QnA 답변 추가
classRouter.post('/:id/question/:qid', (req, res)=>{
    //답변은 튜터가 한다.
    //그 수업의 상태는 수업진행중이어야 한다 ?
    //작성된 질문에 대해 답변 하는것이다.
    //답변이 기존에 안달린 질문에 답변을 하는것이다.
    let targetClassID = req.params.id;
    let targetQuestion = req.params.qid;
    let content = req.body.content;
    let userID = req.session.uid

    //TODO 권한 없을때 응답 어떻게 해야할지 해결할것
    User.isTutorOf(userID, targetClassID, ()=>{
        let newAnswer = {
            target: targetQuestion,
            content: content
        }
        Class.addClassData('Answer', targetClassID, newAnswer, (errmsg)=>{
            if(errmsg){console.log(errmsg); return res.send('fail')}
            res.send('success')
        })
    })
})

//------------------------------------    강의노트    ------------------------------------
//강의노트 전체 조회
classRouter.get('/:id/lecture-note', (req, res)=>{
    let targetClassID = req.params.id;

    Class.findById(targetClassID, (err, Class)=>{
        if(err){console.log(err);return res.send('fail')}
        console.log(Class)
        res.send(Class.lectureNote);
    })
})

//강의노트 게시글 추가
classRouter.post('/:id/lecture-note', (req, res)=>{
    //강의노트 작성은 해당 수업의 튜터가 한다.
    //그 수업의 상태는 수업진행중이어야 한다 ?

    let userID = req.session.uid
    let targetClassID = req.params.id;
    let title = req.body.title;
    let content = req.body.content;
    
    User.isTutorOf(userID, targetClassID, ()=>{
        //강의노트 추가
        let newNote = new LectureNote({
            title: title,
            content: content
        });
        Class.addClassData('LectureNote', targetClassID, newNote, (errmsg)=>{
            if(errmsg){console.log(errmsg); return res.send('fail')}
            res.send('success')
        })
    })
})

//------------------------------------    출결관리    ------------------------------------
//1. 출결 확인


//2. 출석 요청
classRouter.get('/:id/attendance', (req, res)=>{
    //1. 인증번호 생성
    //2. 실시간 채팅방 생성
    let userID = req.session.uid
    let targetClassID = req.params.id;

    User.isTutorOf(userID, targetClassID, ()=>{
        //1. 커리큘럼 온라인 실시간 Or 오프라인형 => 인증번호생성
        //2. 질의응답형 => 채팅방생성
        Class.generateAttendance(targetClassID, (errmsg, authData)=>{
            if(errmsg){console.log(errmsg); return res.send('fail')}
            //인증번호 응답
            res.send(authData)
        })
        //동영상 강의형의 경우 수업객체를 커리큘럼을 추가될떄 자동으로 생성된다.
    })
})

//3. 출석 인증
classRouter.post('/:id/attendance', (req, res)=>{
    //1. 인증번호 인증 -> 튜터 : 인증번호 생성 -> 튜티 : 인증 요청
    //2. 동영상 '봤어요' -> 해당 attendance에 직접 api호출 해야함.
    //3. 채팅방 입장시  -> 튜터 : 채팅방 오픈 -> 튜티 : 입장 (인증 성공)
    let userID = req.session.uid
    let targetClassID = req.params.id;
    let auth = req.body.auth;

    User.isTuteeOf(userID, targetClassID, ()=>{
        // ----- 출석 인증 Process -----
        //강의가 InProgress인가?
        //수업.가장최근.인증번호 == 요청번호 && 수업.가장최근.생성일 + 3분 > 지금
        //수업.가장최근.tutees.push(userID)
        //성공 응답
        Class.attendance(targetClassID, auth, userID, (errmsg)=>{
            if(errmsg) {console.log(errmsg); return res.send('fail')}
            res.send('success')
        })
    })
})

//----------------------------------    수업참여,쳘회    ----------------------------------
//수업 철회하기
classRouter.get('/:id/quit', function(req, res){
    let targetClassID = req.params.id;
    let userID = req.session.uid

    if(!userID){
        console.log('로그인 후 이용해 주세요');
        res.send('fail')
        return;
    }

    User.findById(userID, async (err, user)=>{
        userID = await user._id;

        Class.findById(targetClassID, (err, targetClass)=>{
            let isDeleted = false;
            //targetClass.tutee 중 해당 user가 포함되있을때만 탈퇴 가능하다.
            //user.classesAsTutee 에서 해당 targetclass._id 를 삭제한다.
            //targetClass.tutee 에서 해당 user._id를 삭제한다.

            //Class.tutees에서 해당 유저 제거
            for(let tuteeID of targetClass.tutees){
                if(String(userID) == String(tuteeID)){
                    targetClass.tutees.pull(user._id);
                    console.log('user : ' + user._id + ' 삭제 from class')
                    isDeleted = true;
                }
            }
            //User.classesAsTutee에서 해당 수업 제거
            for(let classID of user.classesAsTutee){
                if(String(targetClass._id) == String(classID)){
                    user.classesAsTutee.pull(targetClass._id)
                    console.log('class : ' + targetClass._id + ' 삭제 from user')
                    isDeleted = true;
                }
            }

            if(isDeleted){
                //삭제성공
                if(targetClass.state == ClassConst.state.JOIN_ABLE){
                    //강의시작전에 수강취소한경우 포인트환불
                    user.point = user.point + targetClass.price;
                }
                res.redirect('/');
            }else{
                //삭제실패
                res.send('fail')
            } 

            //변동사항 저장
            targetClass.save()
            user.save()
        });
    })
})

//수업 참여하기
classRouter.get('/:id/join', function(req, res){
    let targetClassID = req.params.id;
    let userID = req.session.uid

    if(!userID){
        console.log('로그인 후 이용해 주세요');
        res.send('fail')
        return;
    }
    User.findById(userID, async (err, user)=>{

        Class.findById(targetClassID , (err, targetClass)=>{
            if(err){console.log(err); return res.send('fail')}
            let joinAllowed = true;

            // 해당 강의가 open되지 않은경우 or 정원초과
            if(!targetClass.isJoinAllowed()){
                joinAllowed = false;
            }

            // user가 해당 강의 튜터인 경우
            if(String(userID) == String(targetClass.tutor)){
                console.log('요청하는사람이 이미 튜터임')
                joinAllowed = false;
            }

            // user가 이미 해당 강의 튜티인 경우
            for(let tuteeID of targetClass.tutees){
                if(String(userID) == String(tuteeID)){
                    console.log('이미 수강중입니다.')
                    joinAllowed = false;
                }
            }

            //포인트 없으면 수강신청 못함
            if(user.point < targetClass.price){
                console.log('포인트가 부족합니다.')
                joinAllowed = false;
            }

            if(joinAllowed){
                //아직 수강하지 않은경우 -> 수강할 수 있음
                console.log('수강신청완료')

                targetClass.tutees.push(userID);
                targetClass.save();

                //포인트차감
                user.point = user.point - targetClass.price;
                user.classesAsTutee.push(targetClass._id);
                user.save();

                res.redirect('/');
            }else{
                //강의가 참여할 수 없는 상태//내가 그 강의의 튜터인 경우//이미 수강중인경우//강의가 정원 초과한경우//포인트가 부족한경우
                
                console.log('수강신청에 실패했습니다.')
                res.send('fail')
                return;
            }
        });
    })
});


module.exports = classRouter;