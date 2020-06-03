var mongoose = require("mongoose");

// 강의 수요 집계
const LectureDemandSchema = new mongoose.Schema({
  lecture: String,
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
module.exports = LectureDemandSchema;
