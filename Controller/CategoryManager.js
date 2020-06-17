const mongoose = require("mongoose");
const LOG_STRING = "CategoryManager.js : ";
const ClassStateManager = require("./ClassStateManager");
const Category = mongoose.model("Category", require("../Schemas/Category"));
const CategoryBuffer = mongoose.model(
  "CategoryBuffer",
  require("../Schemas/CategoryBuffer")
);

const lib = require("./lib")
const categoryFeedbackWeight = lib.categoryFeedbackWeight
const noiseWeight = lib.noiseWeight
const FeedBack = lib.FeedBack

const KeywordMatchingEngine = require("./KeywordMatchingEngine");
//Get
//해당 Type의 모든 카테고리 종류(대표 단어)들을 반환
async function getReprFromID(id){
  let categoryRepre = await Category.findById(id)
  return categoryRepre.representation
}

async function addToBuffer(queryKeyword, recommended) {
  console.log("addToBuffer");
  let cBuffer = await CategoryBuffer.findOne({ keyword: queryKeyword });

  console.log(cBuffer);

  if (cBuffer == null) {
    //기존에 없으면
    let newBuffer = await CategoryBuffer.create({ keyword: queryKeyword });
    console.log(newBuffer);
    newBuffer.recommended.push({ category: recommended });
    let result = await newBuffer.save();
    console.log("신규 버퍼 생성" + result);
  } else {
    //기존에 있으면
    let has = false;
    for (let recommend of cBuffer.recommended) {
      if (String(recommend.category._id) == String(recommended._id)) {
        has = true;
      }
    }
    if (!has) {
      cBuffer.recommended.push({ category: recommended });
      let result = await cBuffer.save();
      console.log("버퍼 추천 카테고리에 새로 추가함" + result);
    }
  }
}
async function getBufferFeedbacks(queryKeyword) {
  let FeedBacks = new Array();
  let cBuffer = await CategoryBuffer.findOne({ keyword: queryKeyword });
  if (cBuffer != null) {
    for (let recommend of cBuffer.recommended) {
      //recommend : category
      //          : feedback
      FeedBacks.push(
        new FeedBack(recommend.category, [
          new categoryFeedbackWeight(recommend.feedback),
        ])
      );
    }
  }
  console.log(FeedBacks);
  return FeedBacks;
}

async function getAllCategoriesByType(type) {
  let Items = await Category.getItemsByType(type);
  let List = new Array();

  for (let i of Items) {
    List.push({
      representation: i.representation,
      cID: i._id
    });
  }

  return List;
}

//해당 Type의 Name이라는 카테고리의 모든 하위항목들을 반환
async function getSubItemsFromTypeAndName(type, name) {
  let items = [];
  await Category.findOne({ type: type, name: name }, (err, found) => {
    if (err || !found) {
      console.log(err);
      return;
    }
    items = found.subItems;
  });
  return items;
}

//해당 Type에 새로운 카테고리 대분류를 추가
async function addCategory(type, queryKeyword) {
  //TODO 성능 최적화 할것 -> 무향 완전 가중치 그래프를 DB에 미리 저장해놓고 변경사항 없다면 그대로 쓰면 속도향상될듯함.

  let AddResult;
  // //키워드 매칭 & 추가
  console.log(`\n---------------- 카테고리추가 : ${queryKeyword} ----------------`)
  console.log("\n---------------- 카테고리 매칭 ----------------")
  let Matching = await KeywordMatchingEngine.findMatchingCategory(
    type,
    queryKeyword,
    []
  );
  AddResult = await KeywordMatchingEngine.addKeywordsToProperCategory(Matching);

  //카테고리 최적화
  let Categories = await Category.getItemsByType(type);


  for await (let c of Categories) {
    let keywords = c.keywords;
    if (keywords.length >= 2) {
      console.log("\n---------------- 노이즈 필터링 ----------------")
      let noiseInfo = await KeywordMatchingEngine.NoiseFilter(c);
      if (noiseInfo && noiseInfo.keyword == queryKeyword) {
        //검색어가 노이즈 처리된 경우
        console.log("\n---------------- 노이즈발견 ----------------")
        console.log(noiseInfo)
        console.log("\n---------------- 카테고리 매칭 : 노이즈 ----------------")
        Matching = await KeywordMatchingEngine.findMatchingCategory(
          type,
          noiseInfo.keyword,
          [new FeedBack(noiseInfo.category, [new noiseWeight()])]
        );
        AddResult = await KeywordMatchingEngine.addKeywordsToProperCategory(
          Matching
        );
      }
    }
  }
  return AddResult;
}

//TODO 모든 type대응
async function Search(type, queryKeyword, FeedBacks) {
  //키워드 매칭 결과 반환
  let Match = await KeywordMatchingEngine.findMatchingCategory(
    type,
    queryKeyword,
    FeedBacks
  );

  if (Match.toCountUp){
    Match.minDistCategory.CountUp(queryKeyword)
  }
  return Match

}

async function searchOptimization(type, isMatched, queriedKeyword, recommeded) {
  // isMatched : Search 시 queryKeyword가 Match됐는지 안됐는지
  // queriedKeyword : Search 시 매칭 요청한 키워드
  // recommended.categoryID : Search결과로서 추천한 카테고리ID
  //            .accurate : 사용자의 피드백 (true - 결과가 정확함, false - 결과가 잘못됨)
  recommeded.category = await Category.findById(
    recommeded.categoryID,
    (err, cat) => {}
  );

  var FeedBacks = new Array();

  if (isMatched) {
    // 매칭 됐던 키워드 - Category
    for (let keyword of recommeded.category.keywords) {
      if (keyword.key == queriedKeyword) {
        keyword.feedback += recommeded.accurate ? 1 : -1;

        FeedBacks.push(
          new FeedBack(recommeded.category, [
            new categoryFeedbackWeight(keyword.feedback),
          ])
        );
        console.log(FeedBacks[0])
      }
    }
    await recommeded.category.save();

    let Matching = null;
    let AddResult = null;

    if (!recommeded.accurate) {
      //부정적 피드백 왔을때만 꺼내서 재배치

      //방금 검색에서 올렸던 카운트 다시 내리기
      await recommeded.category.CountDown(queriedKeyword)

      let noiseInfo = await KeywordMatchingEngine.NoiseFilter(
        recommeded.category
      );

      if (noiseInfo) {
        //필터링 걸리면

        console.log("필터링으로 다른곳을 삽입")
        console.log(FeedBacks[0])
        Matching = await KeywordMatchingEngine.findMatchingCategory(
          type,
          noiseInfo.keyword,
          FeedBacks
        );
        Matching.queryKeyword = queriedKeyword
        Matching.isMatched = true //강제 기존 그룹으로 삽입
        console.log(Matching)
        AddResult = await KeywordMatchingEngine.addKeywordsToProperCategory(
          Matching
        );
      }
    }
    return AddResult;
  } else {
    //매칭 안됐던 키워드 -> Buffer
    let buffer = await CategoryBuffer.findOne({ keyword: queriedKeyword });

    for (let rCategory of buffer.recommended) {
      //rCategory.category
      //         .feedback
      if (String(rCategory.category._id) == String(recommeded.category._id)) {
        //그녀석 찾으면
        rCategory.feedback += recommeded.accurate ? 1 : -1;

        buffer.FeedbackSum++;
      }

      FeedBacks.push(
        new FeedBack(recommeded.category, [
          new categoryFeedbackWeight(rCategory.feedback),
        ])
      );

      await buffer.save();
      //어딘가로 떠난다
      //  기존 카테고리로 삽입된다
      //  새로운 카테고리를 만든다

      //안떠난다
    }
    //피드백 적용해서 거기 들어갈 수 있는지 보기
    let Matching = await KeywordMatchingEngine.findMatchingCategory(
      type,
      queriedKeyword,
      FeedBacks
    );
    console.log("매칭결과");
    console.log(Matching.minDistCategory);
    console.log(Matching.minDistance);

    //피드백에 대한 행동
    if (Matching.isMatched) {
      //적절한 기존 카테고리로 삽입된다. : 긍정 피드백왔을때
      await KeywordMatchingEngine.addKeywordsToProperCategory(Matching);
      buffer.keyword = "";
      await buffer.save();
    } else {
      //추천목록이 3개 이상이면
      if (buffer.recommended.length > 2) {
        // 새로운 카테고리를 만든다.
        await KeywordMatchingEngine.addKeywordsToProperCategory(Matching);
        buffer.keyword = "";
        await buffer.save();
      }
      //그냥 있는다
    }
  }
}

function addSubItemToCategory(type, newItem) {
  //Type의 기존 카테고리에 새로운 subItem을 추가
  //ex. {"컴퓨터구조", "컴구", "컴구조", "구조", ....... } => "컴퓨터구조"
  // 기존에 데이터가 없음애도 불구하고 최적의 추천값을 찾아서 그 추천값으로 보정해야함
}

module.exports = {
  Search: async (queryKeyword, FeedBacks) => {
    console.log(`검색 요청한 키워드 ${queryKeyword}`);
    return await Search("MAJOR", queryKeyword, FeedBacks);
  },
  searchOptimization: async (isMatched, queriedKeyword, recommeded) => {
    console.log(`최적화 실행 ${queriedKeyword}, ${recommeded}`);
    return await searchOptimization(
      "MAJOR",
      isMatched,
      queriedKeyword,
      recommeded
    );
  },
  addToBuffer: addToBuffer,
  getBufferFeedbacks: getBufferFeedbacks,
  getReprFromID: getReprFromID,
  Major: {
    get: () => {
      return getAllCategoriesByType("MAJOR");
    },
    getSubItems: (majorName) => {
      return getSubItemsFromTypeAndName("MAJOR", majorName);
    },
    addCategory: async (newCategory) => {
      await addCategory("MAJOR", newCategory);
    },
  },
  Interests: {
    get: () => {
      return getAllCategoriesByType("INTERESTS");
    },
    getSubItems: (interestsName) => {
      return getSubItemsFromTypeAndName("INTERESTS", interestsName);
    },
    addCategory: (newCategory) => {
      addCategory("INTERESTS", newCategory);
    },
  },
};
