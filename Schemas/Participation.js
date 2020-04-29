var mongoose = require('mongoose');

    //출결관리
const ParticipationSchema = new mongoose.Schema({
    startTime: {
        type: Date,
        default: Date.now
    },
    authNumber: String,
    tutees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

// const Participation = mongoose.model("Participation", ParticipationSchema);

module.exports = ParticipationSchema;