var mongoose = require('mongoose');

const QnASchema = new mongoose.Schema({
    question: String,
    answer: String
});

const QnA = mongoose.model("QnA", QnASchema);

module.exports = QnA;