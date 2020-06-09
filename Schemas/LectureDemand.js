var mongoose = require("mongoose");

// 강의 수요 집계
const LectureDemandSchema = new mongoose.Schema({
  date:String,
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  count: Number,
});

LectureDemandSchema.statics.sorting = function (Callback) {
  let sortedArr = [];
  this.find({})
    .sort({ count: -1 })
    .exec(function (err, sort) {
      if (err) {
        return console.log(err);
      }
      if (sort != null) {
        sort.forEach((element) => {
          sortedArr.push({
            date: element.date,
            name: element.lecture,
            count: element.count,
          });
        });
      } else {
        console.log("정렬할 정보 없음");
      }
      // console.log("정렬 : " + sortedArr);
      Callback(null, sortedArr);
    });
};

// counting 작업 모듈화
// LectureDemandSchema.statics.counting = function (lectureName, Callback){

// }
module.exports = LectureDemandSchema;
