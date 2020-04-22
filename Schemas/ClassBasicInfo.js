var mongoose = require('mongoose');

const ClassBasicInfoSchema = new mongoose.Schema({
    //성적인증
    grade: String,
    //소개글
    description: String
});

module.exports = ClassBasicInfoSchema;