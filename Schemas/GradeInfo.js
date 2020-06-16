var mongoose = require('mongoose');
// const { schema } = require('./User');

const GradeInfoSchema = new mongoose.Schema({
    imgName: String,
    imgPath: String
});

module.exports = GradeInfoSchema;