var mongoose = require("mongoose");
var Class = require("../Schemas/Class");
var User = require("../Schemas/User");

const ClassConst = require("../Const/Class");
const ClassStateManager = require("../Controller/ClassStateManager");
const ClassDataChecker = require("../Controller/DataManager");

var LectureDemandSchema = require("../Schemas/LectureDemand");

const LectureDemand = mongoose.model("LectureDemand", LectureDemandSchema);

async function Count(targetCategory) {
  // 검색 키워드
  // 검색 결과를 저장할 배열
  var searchingArr = [];
  // 중복 여부를 위한 변수
  var sortedArr;
  var today = new Date();

  //파라미터 카테고리에 해당하는 수요 찾기
  LectureDemand.findOne({ lecture: targetCategory }, async (err, demand) => {
    if (err) {
      console.log(err);
      return;
    }

    if (demand) {
      //기존에 있으면 카운트증가
      demand.count++
      let result = await demand.save()
      console.log("수요 집계완료 " + result)

    } else {
      //기존에 없으면 새로 생성
      var lectureSearch = new LectureDemand({
        lecture: targetCategory,
        count: 1,
        date: today.toLocaleDateString(),
      });

      let result = await lectureSearch.save();
      console.log("수요 정보 새로 생성 완료 " + result);
    }
  });

  // 정렬
  setTimeout(sort, 1700);

  // 정렬 함수
  function sort() {
    LectureDemand.sorting((err, sort) => {
      if (err) {
        console.log(err);
      }
      sortedArr = sort;
      console.log(sortedArr);
    });
  }
}

module.exports = {
  Count: Count,
};
