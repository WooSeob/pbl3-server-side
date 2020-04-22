var express = require('express');
var mongoose = require('mongoose');
var Class = require('../Schemas/Class');
var User = require('../Schemas/User');

var QnASchema = require('../Schemas/QnA')
var ClassBasicInfoSchema = require('../Schemas/ClassBasicInfo')
var CourseSchema = require('../Schemas/Course')
var LectureTimeSchema = require('../Schemas/LectureTime')

const QnA = mongoose.model("QnA", QnASchema);
const Course = mongoose.model("Course", CourseSchema);
const ClassBasicInfo = mongoose.model("ClassBasicInfo", ClassBasicInfoSchema);
const LectureTime = mongoose.model("LectureTime", LectureTimeSchema);

var classRouter = express.Router();

/*
    TODO
    1. 공통정보 CRUD
        1. Class.basicInfo
            1. 성적인증 이미지 url 
            2. 수업소개

    2. 수업타입별 데이터 CRUD
        1. 커리큘럼 온라인 실시간
            1. 정보
                1. 강의시간
                2. 커리큘럼
                3. 최대 튜티수
            2. 기능
                1. 질의응답
                2. 수업노트
                3. 출결관리
                4. 스카이프 링크 ##

        2. 커리큘럼 온라인 실시간X
            1. 정보
                1. 커리큘럼(링크 포함)
            2. 기능
                1. 질의응답
                2. 출결관리(진도율)
                3. 강의시청(링크) ##

        3. 질의응답형
            1. 정보
                1. 강의시간
            2. 기능
                1. 질의응답
                2. 실시간 채팅방 ##

        4. 오프라인형
            1. 정보
                1. 강의시간
                2. 커리큘럼
                3. 최대 튜티수
            2. 기능
                1. 질의응답
                2. 수업노트
                3. 출결관리
*/

//수업생성
classRouter.post('/', function(req, res){
    //튜터 아이디로 수업 생성
    console.log(req.session);
    User.findOne({username: req.session.username}, (err,tutor)=>{
        if(err){ res.send('fail'); return; }

        //기본적으로 강의개설직후는 '튜티모집' 상태
        let state = 'Waiting';
        if(req.body.classType == 'OnlineCourseType'){
            state = 'InProgress';
        }

        var newClass = new Class({
            classType: req.body.classType,
            category: req.body.category,
            studyAbout: req.body.studyAbout,
            className: req.body.className,
            price: req.body.price,
            tutor: tutor._id,
            state: state
        });
        //testing
        console.log(newClass.getClassData(2));
        console.log(newClass.getClassData(3));
        console.log(newClass.getClassData(4));
        newClass.save();

        //이 강의를 개설한 유저의 classesAsTutor 항목에 이 강의 추가
        tutor.classesAsTutor.push(newClass._id);
        tutor.save();
        res.send('success');
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

//강의 기본정보 (성적인증이미지url, 소개글) 추가
classRouter.post('/:id/basic-info', (req, res)=>{
    let targetClassID = req.params.ID;
    var info = new ClassBasicInfo({
        grade: req.body.grade,
        description: req.body.description
    })
    Class.findByIdAndUpdate(targetClassID, {basicInfo: info}, (err, found)=>{
        res.send(found);
    });
})

//강의 커리큘럼 추가
classRouter.post('/:id/course', (req, res)=>{
//@@@ 이 함수는 받아온 데이터로 course 만들어서 Class.course배열에 계속해서 집어넣는 함숩니다. 
    let targetClassID = req.params.id;
    var newCourse = new Course({
        description: req.body.description,
        link: req.body.link
    })
    Class.findById(targetClassID, (err, found)=>{
        found.course.push(newCourse);
        found.save();
    });
})

//강의시간 추가
classRouter.post('/:id/lecture-time', (req, res)=>{
    //@@@ 이 함수는 받아온 데이터로 LectureTime 만들어서 Class.LectureTime배열에 계속해서 집어넣는 함숩니다. 
    let targetClassID = req.params.id;
    var newTime = new LectureTime({
        startAt: req.body.startAt,
        duration: req.body.duration
    })
    Class.findById(targetClassID, (err, found)=>{
        found.lectureTime.push(newTime);
        found.save();
    });
})

//최대 튜티수 추가
classRouter.post('/:id/max-tutee', (req, res)=>{
    //@@@ 이 함수는 Class.maxTutee에 받아온 데이터를 넣는 함숩니다.
    let targetClassID = req.params.id;
    Class.findById(targetClassID, (err, found)=>{
        if(err){
            res.send('fail');
            return;
        }
        found.maxTutee = req.body.maxTutee;
        found.save(()=>{
            res.send('success');
        });
    });
})

//QnA 질문 게시글 추가
classRouter.post('/:id/question', (req, res)=>{
    //질문은 해당 수업의 튜티가 한다.
    //그 수업의 상태는 수업진행중이어야 한다 ?
    let targetClassID = req.params.id;
    let content = req.body.content;

    User.findOne({username: req.session.username}, async (err, user)=>{
        userObjID = await user._id;
        if(user.isTuteeOf(targetClassID)){
            //질문추가
            Class.findById(targetClassID, (err, Class)=>{
                if(err){console.log(err);return res.send('fail')}
                Class.qna.push(new QnA({
                    question: {
                        Writer: user._id,
                        content: content
                    }
                }));
                Class.save(()=>{
                    res.send('success');
                })    
            })
        }
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

    User.findOne({username: req.session.username}, async (err, user)=>{
        let userID = await user._id;
        //현재 로그인 되있는 사람이 그 수업의 튜터일때 답변 작성가능
        if(user.isTutorOf(targetClassID)){
            
            Class.findById(targetClassID, (err, found)=>{
                //답변 달기                
                found.qna.id(targetQuestion).answer = {
                    content: content
                }
                found.save(()=>{
                    console.log('답변 저장')
                    res.send('success')
                })
                console.log(found.qna.id(targetQuestion))
            })
        }else{
            console.log('해당 수업의 튜터가 아닌데 QnA답변 달려고 시도');
            res.send('fail');
        }
    })
})


//수업 철회하기
classRouter.get('/:id/quit', function(req, res){
    let targetClassID = req.params.id;

    if(!req.session.username){
        console.log('로그인 후 이용해 주세요');
        res.send('fail')
        return;
    }

    User.findOne({username: req.session.username}, async (err, user)=>{
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
                    targetClass.save()
                    console.log('user : ' + user._id + ' 삭제 from class')
                    isDeleted = true;
                }
            }
            //User.classesAsTutee에서 해당 수업 제거
            for(let classID of user.classesAsTutee){
                if(String(targetClass._id) == String(classID)){
                    user.classesAsTutee.pull(targetClass._id)
                    user.save()
                    console.log('class : ' + targetClass._id + ' 삭제 from user')
                    isDeleted = true;
                }
            }

            if(isDeleted){
                //삭제성공
                res.redirect('/');
            }else{
                //삭제실패
                res.send('fail')
            }  
        });
    })
})

//수업 참여하기
classRouter.get('/:id/join', function(req, res){
    let targetClassID = req.params.id;
    
    let userObjID;
    if(!req.session.username){
        console.log('로그인 후 이용해 주세요');
        res.send('fail')
        return;
    }
    User.findOne({username: req.session.username}, async (err, user)=>{
        userObjID = await user._id;

        Class.findById(targetClassID , (err, targetClass)=>{
            let joinAllowed = true;

            // user가 해당 강의 튜터인 경우
            if(String(userObjID) == String(targetClass.tutor)){
                console.log('요청하는사람이 이미 튜터임')
                joinAllowed = false;
            }

            // user가 이미 해당 강의 튜티인 경우
            for(let tuteeID of targetClass.tutees){
                if(String(userObjID) == String(tuteeID)){
                    console.log('이미 수강중입니다.')
                    joinAllowed = false;
                }
            }
            
            //정원 초과시 수강신청 못함
            if(targetClass.classType == 'RealtimeOnlineCourseType' 
                || targetClass.classType == 'OfflineType' 
                && targetClass.tutees.length >= targetClass.maxTutee){
                    joinAllowed = false;
            }

            //포인트 없으면 수강신청 못함
            if(user.point < targetClass.price){
                joinAllowed = false;
            }

            if(joinAllowed){
                //아직 수강하지 않은경우 -> 수강할 수 있음
                console.log('수강신청완료')
                
                //포인트차감
                user.point = user.point - targetClass.price;

                targetClass.tutees.push(userObjID);
                targetClass.save();
                user.classesAsTutee.push(targetClass._id);
                user.save();

                res.redirect('/');
            }else{
                //이미 수강중인경우 || 내가 그 강의의 튜터인 경우
                console.log('수강신청에 실패했습니다.')
                res.send('fail')
                return;
            }
        });
    })
});


module.exports = classRouter;