var mongoose = require('mongoose');

//TODO 스키마 고칠것 
const ChatLog = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class"
    },
    messages: [
        new mongoose.Schema({
            from : {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            //TODO String 말고 다른걸로 바꿀것 
            system: Boolean,
            username: String,
            message : String,
            time: {
                type: Date,
                default: Date.now,
            }
        })
    ]
});

// const Course = mongoose.model("Course", CourseSchema);

module.exports = ChatLog;