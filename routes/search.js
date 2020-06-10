var express = require("express");
var User = require("../Schemas/User");
var Class = require("../Schemas/Class");
var Mail = require("../Schemas/MailAuth");

const CM = require("../Controller/CategoryManager");
const LectureDemandManager = require("../Controller/LectureDemandManager");
const KME = require("../Controller/KeywordMatchingEngine");

var searchRouter = express.Router();
searchRouter.use(express.json());

searchRouter.get("/:query", async (req, res) => {
  // 키워드 매칭 작동
  let bufferFeedbacks = await CM.getBufferFeedbacks(req.params.query)
  let MatchingResult = await CM.Search(req.params.query, bufferFeedbacks);
  //모든 수업 불러오기
  let allClasses = await Class.find({}, "className tutor");
  //let AddResult = await CM.Major.addCategory(req.params.query)

  // console.log("매칭 여부 : " + MatchingResult.isMatched);
  // console.log("DistanceAvg : " + MatchingResult.minDistance);
  // console.log("매칭 카테고리 정보 : " + MatchingResult.minDistCategory);

  var searchingArr = [];

  let SearchResult = {
    classes: searchingArr,
    matched: null,
    recommend: null,
  };

  //검색대상 설정
  let targetKeywords;

  if (MatchingResult.isMatched) {
    //매치 됐을때

    targetKeywords = MatchingResult.minDistCategory.keywords;
    SearchResult.matched = {
      categoryID: MatchingResult.minDistCategory._id,
      representation: MatchingResult.minDistCategory.representation,
    };
    await KME.addKeywordsToProperCategory(MatchingResult);
  } else {
    //매치 안됐을때

    await CM.addToBuffer(req.params.query, MatchingResult.minDistCategory);
    console.log("addtobuffer끗")

    targetKeywords = [{ key: req.params.query }];
    SearchResult.recommend = {
      categoryID: MatchingResult.minDistCategory._id,
      representation: MatchingResult.minDistCategory.representation,
    };
  }

  //검색
  for (let keyword of targetKeywords) {
    allClasses.forEach(function (element) {
      if (element.className.indexOf(keyword.key) != -1) {
        searchingArr.push(element);
      }
    });
  }

  if (searchingArr.length == 0) {
    //검색결과 없음
    LectureDemandManager.Count(MatchingResult.minDistCategory);
  }

  res.send(SearchResult);
});

searchRouter.post("/feedback", async (req, res) => {
  //검색 품질 피드백
  // 매칭되서 추천한 키워드
  // console.log(req.body.accurate)
  // console.log(req.body.queriedKeyword)
  // console.log(req.body.isMatched)
  // console.log()

  let recommended = {
    categoryID: req.body.categoryID,
    accurate: JSON.parse(req.body.accurate),
  };
  if (JSON.parse(req.body.isMatched)) {
    console.log("매칭됬던 결과에 대한 피드백 시작");
    //이게 있다면 매칭 true였었다는 뜻
    CM.searchOptimization(true, req.body.queriedKeyword, recommended);
  } else {
    //이게 있다면 매칭 false였다는 뜻
    console.log("매칭안됬던 결과에 대한 피드백 시작");
    CM.searchOptimization(false, req.body.queriedKeyword, recommended);
  }
});

module.exports = searchRouter;
