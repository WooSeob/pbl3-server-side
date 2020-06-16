var mongoose = require('mongoose');
// const { schema } = require('./User');

const GradeInfoSchema = new mongoose.Schema({
    gradeImage: mongoose.Schema.Types.Mixed,
});

module.exports = GradeInfoSchema;