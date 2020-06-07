const mongoose = require("mongoose");
const LOG_STRING = "CategoryManager.js : ";
const ClassStateManager = require("./ClassStateManager");
const Category = mongoose.model("Category", require("../Schemas/Category"));

const KeywordMatchingEngine = require("./KeywordMatchingEngine");
//Get
//해당 Type의 모든 카테고리 종류(대표 단어)들을 반환
async function getAllCategoriesByType(type) {
  let Items = await Category.getItemsByType(type);
  let List = new Array();

  for (let i of Items) {
    List.push(i.representation);
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
  //키워드 매칭 & 추가
  AddResult = await KeywordMatchingEngine.addKeywordsToProperCategory(type, queryKeyword, null);

  //카테고리 최적화
  let Categories = await Category.getItemsByType(type);

  for await (let c of Categories) {
    let keywords = c.keywords;
    if (keywords.length >= 2) {
      let noiseInfo = await KeywordMatchingEngine.NoiseFilter(c);
      if (noiseInfo && noiseInfo.keyword == queryKeyword) {
        //검색어가 노이즈 처리된 경우
        let feedback = { 
          target: noiseInfo.category,
          Weights: { noiseFilter: 2.0 }
        }
        AddResult = await KeywordMatchingEngine.addKeywordsToProperCategory(type, noiseInfo.keyword, feedback)
      }
    }
  }
  return AddResult
}

//TODO 모든 type대응
async function Search(type, queryKeyword) {
  let Categories = await Category.getItemsByType(type);
  //키워드 매칭 결과 반환
  return await KeywordMatchingEngine.findMatchingCategory(
    type,
    queryKeyword,
    null
  );
}

async function searchOptimization(type, isMatched, queriedKeyword, recommeded) {
  // isMatched : Search 시 queryKeyword가 Match됐는지 안됐는지
  // queriedKeyword : Search 시 매칭 요청한 키워드
  // recommended.category : Search결과로서 추천한 카테고리
  //            .accurate : 사용자의 피드백 (true - 결과가 정확함, false - 결과가 잘못됨)
  let feedback = null;
  recommeded.category = await Category.findById(recommeded.categoryID, (err, cat)=>{})

  if (isMatched) {
    //매칭 성공했던 키워드-카테고리 검색건에 대해서
    if(recommeded.accurate){
      //TODO 어차피 이미 들어있었고 다시들어갈테니 weight작게하는거말고 연결성을 더 강화해주는 방법필요
      feedback = { 
        target: recommeded.category,
        Weights: { accurateWeight: 0.1 }
      }
    }else{
      //추천이 부 정확한 경우
      console.log(`키워드 ${queriedKeyword}에 대해 매칭에 성공해서 추천했던 카테고리${recommeded.category}가 부정확 하다는 피드백이 왔기 때문에 가중치를 높이고 재배치합니다.`)
      
      let keywords = recommeded.category.keywords;
      let matchingIndex = KeywordMatchingEngine.searchKeyword(keywords, queriedKeyword)

      if(matchingIndex != -1){
          //카테고리에서 해당 키워드 제거  
        keywords.splice(matchingIndex, 1);
        recommeded.category.keywords = keywords;
          //변동사항 저장
        let result = await recommeded.category.save();
        console.log(result)
      }
      
      //TODO 추천이 부정확 하다고 피드백 받은경우 Distance평균을 2.0배 해서 
      
      feedback = { 
        target: recommeded.category,
        Weights: { inaccurateWeight: 2.0 }
      }
    }
  } else {
    //매칭에 성공하지 못하고 그나마 가장 유사한 카테고리를 추천했던 경우
    if (recommeded.accurate) {
      //추천이 정확한 경우
      console.log(`키워드${queriedKeyword}에 대해 매칭에 실패했지만 추천했던 유사 카테고리${recommeded.category}가 정확 하다는 피드백이 왔기 때문에 가중치를 낮춰서 재배치합니다.`)
      
      //TODO 추천이 정확 하다고 피드백 받았기 때문에 Distance평균을 0.3배 해서 
      feedback = { 
        target: recommeded.category,
        Weights: { accurateWeight: 0.1 }
      }
    } else {
      //추천이 부정확한 경우
      console.log(`키워드${queriedKeyword}에 대해 매칭에 실패했지만 추천했던 유사 카테고리${recommeded.category}가 부 정확 하다는 피드백이 왔기 때문에 가중치를 높이고 재배치합니다.`)
      
      //TODO 추천이 부정확 하다고 피드백 받았기 때문에 Distance평균을 2.0배 해서 
      feedback = { 
        target: recommeded.category,
        Weights: { inaccurateWeight: 2.0 }
      }
    }
  }

  let MatchingResult = await KeywordMatchingEngine.addKeywordsToProperCategory(
    type,
    queriedKeyword,
    feedback
  );
  return MatchingResult
}

function addSubItemToCategory(type, newItem) {
  //Type의 기존 카테고리에 새로운 subItem을 추가
  //ex. {"컴퓨터구조", "컴구", "컴구조", "구조", ....... } => "컴퓨터구조"
  // 기존에 데이터가 없음애도 불구하고 최적의 추천값을 찾아서 그 추천값으로 보정해야함
}

module.exports = {
  Search: async (queryKeyword) => {
    console.log(`검색 요청한 키워드 ${queryKeyword}`);
    return await Search("MAJOR", queryKeyword);
  },
  searchOptimization: async (isMatched, queriedKeyword, recommeded)=>{
    console.log(`최적화 실행 ${isMatched}, ${queriedKeyword}, ${recommeded}`)
    return await searchOptimization("MAJOR", isMatched, queriedKeyword, recommeded)
  },
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
