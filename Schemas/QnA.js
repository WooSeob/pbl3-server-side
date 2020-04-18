var mongoose = require('mongoose');

const QnASchema = new mongoose.Schema({
    question: new mongoose.Schema({
        Writer : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        content: String
    }),
    answer: new mongoose.Schema({
        createdAt: {
            type: Date,
            default: Date.now
        },
        content: String
    })
});

// const QnA = mongoose.model("QnA", QnASchema);

module.exports = QnASchema;