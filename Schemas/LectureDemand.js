var mongoose = require("mongoose");

// 강의 수요 집계
const LectureDemandSchema = new mongoose.Schema({
  lecture: String,
  count: Number
});


LectureDemandSchema.statics.sort = function(count, Callback){
  
}
module.exports = LectureDemandSchema;

