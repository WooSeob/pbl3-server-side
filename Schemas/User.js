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

const User = mongoose.model("User", UserSchema);

module.exports = User;