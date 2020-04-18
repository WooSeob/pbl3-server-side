var mongoose = require('mongoose');

const ClassBasicInfoSchema = new mongoose.Schema({
    //성적인증
    grade: String,
    //소개글
    description: String,
    //수업시간
    lectureTime: [
            new mongoose.Schema({
            startAt: Date,
            duration: Number
        })
    ]
});

module.exports = ClassBasicInfoSchema;