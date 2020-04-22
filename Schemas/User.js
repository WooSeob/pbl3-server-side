var mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    nickname: String,
    webmail: String,
    point: Number,
    classesAsTutee: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class"
        }
    ],
    classesAsTutor: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class"
        }
    ],
    //데이터 추가중......
});

/*
    스키마 -> 모델 -> 다큐먼트
*/

/*
    User 모델이 호출하는 메서드
    모델 = mongoose.model("모델명", 스키마)
    스키마로 모델을 만든다
*/
UserSchema.statics.isTutorOf = function(userID, ClassID, next){
    this.findById(userID)
    .then((user)=>{
        console.log('found')
        if(user.classesAsTutor.includes(ClassID)){
            next();
        }else{
            console.log('해당 강의의 튜터가 아닙니다.')
        }
    })
    .catch((err)=>{
        console.log(err)
    })
};

UserSchema.statics.isTuteeOf = function(userID, ClassID, next){
    this.findById(userID)
    .then((user)=>{
        console.log('found')
        if(user.classesAsTutee.includes(ClassID)){
            next();
        }else{
            console.log('해당 강의의 튜티가 아닙니다.')
        }
    })
    .catch((err)=>{
        console.log(err)
    })
};

/*
    User 다큐먼트가 호출하는 메서드
    (다큐먼트 = new User모델)
    모델로 다큐먼트를 만든다
*/

//User가 그 수업의 튜티인지 확인하는 함수
UserSchema.methods.isTuteeOf = function(ClassID){
    if(this.classesAsTutee.includes(ClassID)){
        console.log(this.id + '는 수업' + ClassID + '의 튜티입니다.')
        return true;
    }else{
        return false;
    }
};

//User가 그 수업의 튜터인지 확인하는 함수
UserSchema.methods.isTutorOf = function(ClassID){
    if(this.classesAsTutor.includes(ClassID)){
        console.log(this.id + '는 수업' + ClassID + '의 튜티입니다.')
        return true;
    }else{
        return false;
    }
};

const User = mongoose.model("User", UserSchema);

module.exports = User;