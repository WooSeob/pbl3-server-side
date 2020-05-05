var mongoose = require('mongoose');

const LectureTimeSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    start: String,
    finish: String
});
// const Course = mongoose.model("Course", CourseSchema);

module.exports = LectureTimeSchema;