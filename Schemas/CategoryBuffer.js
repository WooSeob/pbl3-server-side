var mongoose = require("mongoose");

const CategoryBufferSchema = new mongoose.Schema({
  keyword: String,
  NFeedback: {
    type: Number,
    default: 0,
  },
  FeedbackSum:{
      type: Number,
      default: 0
  },
  recommended: [
    {
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
      feedback: {
        type: Number,
        default: 0,
      },
    },
  ],
});

module.exports = CategoryBufferSchema;
