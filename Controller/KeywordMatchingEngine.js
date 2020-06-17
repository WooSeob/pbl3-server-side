const mongoose = require("mongoose");
const Category = mongoose.model("Category", require("../Schemas/Category"));


const lib = require("./lib")
const WordGraph = lib.WordGraph
const exsWeight = lib.exsWeight
const lengthWeight = lib.lengthWeight
const countWeight = lib.countWeight
const categoryLengthWeight = lib.categoryLengthWeight

const uniqueWordSeperator = lib.uniqueWordSeperator
const exCompare = lib.exCompare
const calcDistance = lib.calcDistance


async function addKeywordsToProperCategory(MatchingResult) {
  if (MatchingResult.isMatched) {
    //삽입할 카테고리를 찾은경우

    // TODO 요청받은 키워드를 기존 카테고리로 매칭 추천할 때 유의사항
    // minDistCategory.category.representation 을 의미하는게 맞나요 ?
    // -> Y -> minDistCategory.category.keywords.push({ key: queryKeyword })
    // -> N -> 새로운 카테고리 생성 (기존에 추천한 카테고리가 적절하지 않음이 사람에 의해 확인 됐으니
    //                             기존 추천한 카테고리와 요청받은 키워드 사이에 음의 가중치를 적용해서
    //                             다음에 분류되지않도록 해야함 )
    //         N 라고 응답한 사람수에 비례해서 새로운 카테고리로 분류할지 말지 결정해야함

    if (!MatchingResult.isProcessed) {
      //할일이 남아있는경우 (기존 키워드와 일치해서 카운트 올리고 끝난경우 말고)
      console.log(MatchingResult.minDistCategory); //추가
      MatchingResult.minDistCategory.keywords.push({
        key: MatchingResult.queryKeyword,
      }); //저장
      let result = await MatchingResult.minDistCategory.save();
      // console.log("완료 : " + result.keywords);
      return result;
    }
  } else {
    //삽입할 카테고리를 찾지 못했거나, 기존 데이터가 하나도 없는경우
    console.log("적절하게 삽입할 곳이 없습니다.");

    var newEntity = await Category.create({ type: "MAJOR" }); //카테고리 새로만들기
    newEntity.keywords.push({ key: MatchingResult.queryKeyword }); // 새로만든 카테고리에 키워드 추가
    let result = await newEntity.save(); //저장
    console.log("새로 생성 : " + result);
    return result;
  }
}

async function findMatchingCategory(type, queryKeyword, FeedBacks) {
  let Categories = await Category.getItemsByType(type);
  // console.log(Categories)

  //이미 키워드가 존재 할 때
  for (let c of Categories) {
    for (let keyword of c.keywords) {
      if (keyword.key === queryKeyword) {
        //기존 카테고리 내 키워드와 일치하는 경우
        let result = {
          isMatched: true,
          isProcessed: true,
          toCountUp: true,
          queryKeyword: queryKeyword,
          minDistCategory: c,
          minDistance: 0,
        };
        return result;
      }
    }
  }

  //모든 카테고리들과 queryKeyword와의 Distance평균이 가장 작은 카테고리 찾기
  let minDistCategory = await getMinDistanceCategory(
    Categories,
    queryKeyword,
    FeedBacks
  );
  console.log(minDistCategory)

  let result = {
    isMatched: minDistCategory && minDistCategory.distAvg <= 4,
    queryKeyword: queryKeyword,
    minDistCategory: minDistCategory ? minDistCategory.category : null,
    minDistance: minDistCategory ? minDistCategory.distAvg : null,
  };
  return result;
}

async function NoiseFilter(category) {
  // console.log("noiseFilter 호출")
  let keywords = category.keywords;

  if(keywords.length == 1){
    //vertex : 1개
  
    let noiseKeyword = keywords[0]
    category.keywords = [];

    let noiseInfo = {
      keyword: noiseKeyword.key,
      category: await category.save(),
    };
    return noiseInfo
  }
  //카테고리 하나에 대한 Distance가중치 무향 완전그래프 생성
  let wordGraph = new WordGraph(keywords);

  wordGraph.getGraphInfo();

  if (wordGraph.isNoiseDetected()) {
    //노이즈 발견
    console.log(
      "\n" + wordGraph.getNoiseEdge().vertex2.keyword + " 는 Noise 입니다."
    );
    //TODO vertex2로 지정해도 되는건지?
    let noiseKeyword = wordGraph.getNoiseEdge().vertex2.keyword;

    category.keywords.splice(searchKeyword(category.keywords, noiseKeyword), 1);
    console.log("제거결과 : " + category.keywords);
    console.log(category);

    let noiseInfo = {
      keyword: noiseKeyword,
      category: await category.save(),
    };
    return noiseInfo;
  } else {

    return null;
  }
}

async function getMinDistanceCategory(Categories, queryKey, FeedBacks) {
  // @Params
  // type - Category.type
  // Categories - Categories Collection 내 모든 Document
  // queryKeyword - 추가하고자 하는 Keyword
  // isNoise - 노이즈로 제거된 키워드 새롭게 추가할때 보내는 부가정보 (다시 기존그룹으로 들어가지 않게끔)

  let similar = new Array();

  for (let c of Categories) {
    // @c DB내 여러 카테고리들중 하나
    let distAvg = 0;
    let exCnt = 0;

    if(c.keywords.length == 0) {
      //TODO 너무 큰 가중치로 인한 Overflow조심
      distAvg = 9999999
    }

    //하나의 카테고리에 대해
    for (let keyword of c.keywords) {
      // console.log(c.keywords)
      //keyword - queryKeyword 가 서로 줄임말일 경우 가중치 up
      if (exCompare(keyword.key, queryKey)) {
        exCnt++;
      }
      
      //Distance 평균 구하기
      let queryKeyword = {key : queryKey}

      let Weights = [
        new lengthWeight(keyword, queryKeyword),
        new countWeight(keyword.count, c.sumCnt)
      ] 

      distAvg += calcDistance(keyword, queryKeyword, Weights)
    }

    //한 키워드 - 한 카테고리 간의 구해진 DistAvg에 가중치 처리
    let Weights = [
      new categoryLengthWeight(Categories.length),
      new exsWeight(exCnt)
    ]

    // Distance 평균 구하기
    distAvg = getWeightedDistAvg(distAvg, Weights)

    // 피드백에 의한 Distance평균에 가중치 처리 해주기
    FeedBacks.forEach( F => {
      console.log(F)
      distAvg = F.getFeedbacked(c, distAvg)
    })
    console.log(`QueryKey ${queryKey} 와 카테고리 ${c.getKeys()}의 D : ${distAvg}`)
    // Distance를 포함한 정보를 리스트에 추가
    similar.push({
      category: c,
      distAvg: distAvg,
    });
  }

  // 정렬
  similar.sort((a, b) => {
    return a.distAvg > b.distAvg ? -1 : 1;
  });

  // 가장 DistAvg가 작은 {카테고리, DistAvg} 를 반환
  return similar.pop();
}

function getWeightedDistAvg(DistanceAverage, Weights) {
  // keyword : keywords (1:다) 하나의 키워드와 카테고리 키워드들에 대한 Distance 평균
  let DistAvg = DistanceAverage
  Weights.forEach(element => {
    DistAvg = element.getWeighted(DistAvg)
  })
  return DistAvg;
}

function searchKeyword(arr, keyword) {
  for (let i in arr) {
    if (arr[i].key === keyword) {
      return i;
    }
  }
  return -1;
}

module.exports = {
  addKeywordsToProperCategory: addKeywordsToProperCategory,
  findMatchingCategory: findMatchingCategory,
  NoiseFilter: NoiseFilter,
  searchKeyword: searchKeyword,
};