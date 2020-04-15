var express = require('express');
//var Class = require('../Schemas/Class');
var User = require('../Schemas/User');
var router = express.Router();

// TODO 비밀번호 암호화 할것
// 로그인
router.post('/login', function(req, res){
    var uname = req.body.username;
    var pwd = req.body.password;
    User.findOne({username: uname}, (err, user)=>{
        if(err || user == null){
            console.log('존재하지않는 아이디');
            res.send('fail');
            return;
        }
        console.log(user);
        if(pwd == user.password){
            //로그인 성공
            req.session.username = user.username;
            req.session.save(()=>{
                console.log(req.session);
                console.log('로그인 성공.');
                res.send('success')
            })
        }else{
            res.send('fail');
        }
    })
})

//로그아웃
router.get('/logout', function(req, res){
    delete req.session.username;
    req.session.save(()=>{
        console.log(req.session);
        console.log('로그아웃 됬습니다.');
        res.redirect('/')
    })
})

//로그인정보 받아오기
router.get('/isAuthenticated', function(req, res){
    //로그인정보 받아오기
    //로그인 되있으면 유저정보 응답
    //로그인 안되있으면 'fail' 응답
    if(req.session.username){
        User.findOne({username: req.session.username}, (err, user)=>{
            if(err){
                console.log(req.session.username + '에 해당하는 유저를 찾을 수 없습니다.');
            }
            res.send(user.toJSON());
        });
    }else{
        res.send('fail');
    }
})


module.exports = router;