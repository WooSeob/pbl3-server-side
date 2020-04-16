var express = require('express');
var Class = require('../Schemas/Class');
var User = require('../Schemas/User');
var router = express.Router();

//수업 정보 받아오기
router.get('/:name', function(req, res){
    console.log('/class/~')
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

//수업 철회하기
router.get('/:name/quit', function(req, res){
    let targetClassName = req.params.name;

    if(!req.session.username){
        console.log('로그인 후 이용해 주세요');
        res.send('fail')
        return;
    }

    User.findOne({username: req.session.username}, async (err, user)=>{
        userID = await user._id;

        Class.findOne({className: targetClassName}, (err, targetClass)=>{
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
router.get('/:name/join', function(req, res){
    let targetClassName = req.params.name;
    
    let userObjID;
    if(!req.session.username){
        console.log('로그인 후 이용해 주세요');
        res.send('fail')
        return;
    }
    User.findOne({username: req.session.username}, async (err, user)=>{
        userObjID = await user._id;

        Class.findOne({className: targetClassName}, (err, targetClass)=>{
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
            
            if(joinAllowed){
                //아직 수강하지 않은경우 -> 수강할 수 있음
                console.log('수강신청완료')

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

module.exports = router;