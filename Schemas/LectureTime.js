var mongoose = require('mongoose');

const LectureTimeSchema = new mongoose.Schema({
    startAt: Date,
    duration: Number
});
// const Course = mongoose.model("Course", CourseSchema);

module.exports = LectureTimeSchema;