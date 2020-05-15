var mongoose = require('mongoose');

    //출결관리
const AttendanceSchema = new mongoose.Schema({
    startTime: {
        type: Date,
        default: Date.now
    },
    authNumber: String,
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    tutees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

// const Participation = mongoose.model("Participation", ParticipationSchema);

module.exports = AttendanceSchema;