var mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    description: String,
    link: String
});

// const Course = mongoose.model("Course", CourseSchema);

module.exports = CourseSchema;