var express = require("express");
var User = require("../Schemas/User");
var Class = require("../Schemas/Class");
var Mail = require("../Schemas/MailAuth");

const CM = require("../Controller/CategoryManager");
const LectureDemandManager = require("../Controller/LectureDemandManager");

var searchRouter = express.Router();
searchRouter.use(express.json());

searchRouter.get("/:query", async (req, res) => {
  // 키워드 매칭 작동
  let MatchingResult = await CM.Search(req.params.query);
  await CM.Major.addCategory(req.params.query)
  
  console.log("매칭 여부 : " + MatchingResult.isMatched);
  console.log("DistanceAvg : " + MatchingResult.minDistance);
  console.log("매칭 카테고리 정보 : " + MatchingResult.minDistCategory);

  var searchingArr = [];

  let SearchResult = {
    classes: searchingArr,
    matchedKeyword: null,
    recommendKeyword: null,
  };

  //모든 수업 불러오기
  let allClasses = await Class.find({}, "className tutor");

  //검색대상 설정
  let targetKeywords;
  if (MatchingResult.isMatched) {
    //매치 됐을때
    targetKeywords = MatchingResult.minDistCategory.keywords;
    SearchResult.matchedKeyword = MatchingResult.minDistCategory.representation;
  } else {
    //매치 안됐을때
    targetKeywords = [{ key: req.params.query }];
    SearchResult.recommendKeyword =
      MatchingResult.minDistCategory.representation;
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

  console.log("접속자 정보 : ");
  console.log(req.session);
  res.send(SearchResult);
});

searchRouter.post("/feedback", async (req, res) => {
  //검색 품질 피드백
  // 매칭되서 추천한 키워드

  req.body.queriedKeyword

  if(req.body.matchedKeyword){
    //이게 있다면 매칭 true였었다는 뜻
  }
  if(req.body.recommendKeyword){
    //이게 있다면 매칭 false였다는 뜻
  }
});

module.exports = searchRouter;
