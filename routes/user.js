var express = require('express');
var User = require('../Schemas/User');
var router = express.Router();


//회원가입
router.post('/register', function(req, res){
    User.create({
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.nickname,
        webmail: req.body.webmail,
        point: 1000,
        classesAsTutee: [],
        classesAsTutor: []
    });
    res.send('Create Successfully');
})

//모든 유저보기
router.get('/all', function(req, res){
    User.find({})
    .then((data)=>{
        res.send(data);
        console.log(data);
    })
    .catch((err)=>{
        console.log(err);
    })
});

//유저 정보보기
router.get('/:id', function(req, res){
    var id = req.params.id;
    User.find({username: id}, (err,data)=>{
        console.log(data);
        res.send(data)
    });
});


module.exports = router;