var mongoose = require('mongoose');

//강의노트 게시판
const LectureNoteSchema = new mongoose.Schema({
    title: String,
    content: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
});


module.exports = LectureNoteSchema;