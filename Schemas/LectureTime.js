var mongoose = require('mongoose');

const LectureTimeSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    start: Number,
    finish: Number
});
// const Course = mongoose.model("Course", CourseSchema);

module.exports = LectureTimeSchema;