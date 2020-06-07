const mongoose = require("mongoose");
const Category = mongoose.model("Category", require("../Schemas/Category"));
const levenshtein = require("fast-levenshtein");

async function addKeywordsToProperCategory(type, queryKeyword, FeedBack) {
  let  MatchingResult = await findMatchingCategory(type, queryKeyword, FeedBack);

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
      MatchingResult.minDistCategory.keywords.push({ key: queryKeyword }); //저장
      let result = await MatchingResult.minDistCategory.save();
      console.log("완료 : " + result.keywords);
      return result;
    }
  } else {
    //삽입할 카테고리를 찾지 못했거나, 기존 데이터가 하나도 없는경우
    console.log("적절하게 삽입할 곳이 없습니다.");

    var newEntity = await Category.create({ type: type }); //카테고리 새로만들기
    newEntity.keywords.push({ key: queryKeyword }); // 새로만든 카테고리에 키워드 추가
    let result = await newEntity.save(); //저장
    console.log("새로 생성 : " + result);
    return result;
  }
}

async function findMatchingCategory(type, queryKeyword, FeedBack) {
  let Categories = await Category.getItemsByType(type);
  console.log("findMatchingCategory~~~~~~~~~~")
  console.log(Categories)
  console.log(queryKeyword);

  //이미 키워드가 존재 할 때
  for (let c of Categories) {
    for (let keyword of c.keywords) {
      if (keyword.key === queryKeyword) {
        //기존 카테고리 내 키워드와 일치하는 경우

        //TODO 최적화 작업을 하지 않고 그대로 카운트롤 올려버려도 되는지?
        keyword.count++;

        //TODO 대표 keyword를 결정하는 기준 생각해보기
        //TODO save 스키마 커스텀 메서드 단에서 representations갱신 처리 해주는걸로 바꾸기
        if (c.maxCnt < keyword.count) {
          // 대표 키워드 갱신
          c.maxCnt = keyword.count;
          c.representation = keyword.key;
        }
        let saveResult = await c.save();
        console.log(
          `이미 존재하는 키워드 ${saveResult}에 대한 카운트를 증가 시켰습니다.`
        );

        let result = {
          isMatched: true,
          isProcessed: true,
          queryKeyword: queryKeyword,
          minDistCategory: saveResult
        };
        return result;
      }
    }
  }

  //모든 카테고리들과 queryKeyword와의 Distance평균이 가장 작은 카테고리 찾기
  let minDistCategory = await getMinDistanceCategory(
    Categories,
    queryKeyword,
    FeedBack
  );

  let result = {
    isMatched: minDistCategory && minDistCategory.distAvg <= 4,
    queryKeyword: queryKeyword,
    minDistCategory: (minDistCategory) ? minDistCategory.category : null
  };
  return result;
}

async function NoiseFilter(category) {
  // console.log("noiseFilter 호출")
  let keywords = category.keywords;

  let wordGraph = new Array();
  //카테고리 하나에 대한 Distance가중치 무향 완전그래프 생성
  for (let i = 0; i < keywords.length - 1; i++) {
    for (let j = i + 1; j < keywords.length; j++) {
      let newEdge = {
        vertex1: {
          keyword: keywords[i].key,
          index: i,
        },
        vertex2: {
          keyword: keywords[j].key,
          index: j,
        },
        distance: calcDistance(keywords[i].key, keywords[j].key),
      };
      wordGraph.push(newEdge);
    }
  }
  wordGraph.sort((a, b) => {
    return a.distance > b.distance ? 1 : -1;
  });
  console.log(wordGraph);

  //3분위수
  let Q3 =
    wordGraph.length >= 6 ? wordGraph.length * 0.75 : wordGraph.length / 2;
  let Q3s = wordGraph.length >= 6 ? Math.floor(Q3) - 1 : Math.floor(Q3);

  // console.log("Q3 is : " + Q3)
  let distAvg = 0;
  for (let edge of wordGraph) {
    distAvg += edge.distance;
  }

  //3분위수(Distance)
  //TODO 역치값 최적화
  let Threshold = (distAvg / wordGraph.length) * 1;
  //wordGraph[Q3s].distance * 0.75 + wordGraph[Q3s + 1].distance * 0.25;

  let noiseIndex = wordGraph.length - keywords.length + 1;
  console.log(
    "NoiseDist : " +
      wordGraph[noiseIndex].distance +
      ", Threshod : " +
      Threshold
  );

  if (Threshold != 0 && wordGraph[noiseIndex].distance >= Threshold) {
    //노이즈 발견
    console.log(
      "\n" + wordGraph[noiseIndex].vertex2.keyword + " 는 Noise 입니다."
    );

    //TODO vertex2로 지정해도 되는건지?
    let noiseKeyword = wordGraph[noiseIndex].vertex2.keyword;

    keywords.splice(searchKeyword(keywords, noiseKeyword), 1);
    console.log("제거결과 : " + keywords);
    category.keywords = keywords;
    let result = await category.save();

    let noiseInfo = {
      keyword: noiseKeyword,
      category: result,
    };
    return noiseInfo;
  } else {
    // console.log("noiseFilter 리턴")
    return null;
  }
}

async function getMinDistanceCategory(Categories, queryKeyword, FeedBack) {
  // @Params
  // type - Category.type
  // Categories - Categories Collection 내 모든 Document
  // queryKeyword - 추가하고자 하는 Keyword
  // isNoise - 노이즈로 제거된 키워드 새롭게 추가할때 보내는 부가정보 (다시 기존그룹으로 들어가지 않게끔)

  let similar = new Array();

  for (let c of Categories) {
    // @c DB내 여러 카테고리들중 하나
    let dS = 0;
    let exCnt = 0;

    //하나의 카테고리에 대해
    for (let keyword of c.keywords) {
      //keyword - queryKeyword 가 서로 줄임말일 경우 가중치 up
      if (exCompare(keyword.key, queryKeyword)) {
        exCnt++;
      }
      // 비교하는 두 문자열 크기의 차이
      let keyLengthAvg =
        (uniqueWordSeperator(keyword.key).length +
          uniqueWordSeperator(queryKeyword).length) /
        2;
      let lengthWeight =
        keyLengthAvg <= 4 ? Math.pow(2.7, 4 - keyLengthAvg) : 1;
      //Distance 합산
      dS +=
        levenshtein.get(
          uniqueWordSeperator(keyword.key),
          uniqueWordSeperator(queryKeyword)
        ) * lengthWeight;
    }

    let keywordsLength = c.keywords.length; //대상 카테고리 키워드 리스트 길이

    // 가중치 계산
    let Weights = {
      //대상 카테고리 키워드 리스트 길이 가중치 - 한 카테고리를 지칭하는 단어가 많을 가능성이 적다
      keywordsLength: Math.pow(1.2, keywordsLength - 2),
      //전체 카테고리 수 가중치 - 전체 카테고리들의 수가 적을수록 dS커지게
      categoryLength:
        Categories.length <= 10 ? Math.pow(1.1, 10 - Categories.length) : 1,
      //줄임말 가중치 - 줄임말에 해당하는 단어가 많을수록 Distance를 매우 작게 만들어 해당 카테고리로 분류되도록
      ex: Math.pow(10, -exCnt),
    };

    // Distance 평균 구하기
    console.log(`\n${c.keywords}에 대한 가중치 계산`)
    let distAvg = getDistAvg(dS, keywordsLength, Weights);
    console.log(`distAvg = ${distAvg}`)

  
    // 피드백에 의한 Distance평균에 가중치 처리 해주기
    if(FeedBack && String(c._id) === String(FeedBack.target._id)){
      for (let weight in FeedBack.Weights) {
        //1. 기존 카테고리에서 노이즈 필터링으로 제거되서 넘어온 경우
        //   - 기존에 있던 카테고리에 다시 배치될 가능성을 낮추기 위해 Distance를 2배 해준다.
        //2. 검색 결과에 대한 피드백으로서 받은 가중치를 적용해 준다.
        //   - 검색결과가 정확할 때 : Weight > 1 Distance를 크게 만들어 원래 카테고리에 배치될 가능성을 낮춤
        //   - 검색결과가 부정확할 때 : Weight < 1
        distAvg *= FeedBack.Weights[weight];
        console.log(
            `피드백에 의해 키워드(${queryKeyword})에 대한 카테고리 ${c}의 DistanceAvg를 ${FeedBack.Weights[weight]}배(${distAvg}) 합니다.`
        );
      }
    }
    

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

function getDistAvg(distanceSum, keywordsLength, Weights) {
  // keyword : keywords (1:다) 하나의 키워드와 카테고리 키워드들에 대한 Distance 평균
  let DistAvg = 0;
  if (distanceSum != 0) {
    DistAvg = distanceSum / keywordsLength;
    // ----- 가중치 곱하기 -----
    for (let weight in Weights) {
      console.log(`가중치 ${weight}(${Weights[weight]}) 곱하기`)
      DistAvg *= Weights[weight];
      console.log(`DistAvg =  ${DistAvg}`)
    }
  }
  return DistAvg;
}

function searchKeyword(arr, keyword) {
  for (let i in arr) {
    if (arr[i].key === keyword) {
      return i;
    }
  }
  return -1
}

function uniqueWordSeperator(word) {
  // (공)학(과) 단어를 제외해주는 함수
  var majorPattern = /공?학과?/;
  var m = word.match(majorPattern);
  var result = m ? word.substring(0, m.index) : word;
  // console.log("input : " + word + ", output : " + result)
  return result;
}

function exCompare(s1, s2) {
  //ex. 컴퓨터공학과 <-> 컴공 true
  //    컴퓨터공학과 <-> 화공 false
  let startPos = 0;

  let fullName, exName;
  fullName = s1.length > s2.length ? s1 : s2;
  exName = s1.length < s2.length ? s1 : s2;

  for (let token of exName) {
    for (let i = startPos; i < fullName.length; i++, startPos++) {
      if (fullName[i] === token) {
        startPos = i + 1;
        break;
      }
    }
    if (startPos == fullName.length) {
      //   console.log(fullName + " with " + exName + " didnt matched");
      return false;
    }
  }
  //   console.log(fullName + " with " + exName + " matched");
  return true;
}

function calcDistance(s1, s2) {
  //console.log("\n "+ s1 + " - " + s2)
  let exWeigh = exCompare(s1, s2) ? 0.01 : 1; //줄임말 관계가 맞으면 distance를 매우 작게 만들어준다

  let seperatedS1 = uniqueWordSeperator(s1);
  let seperatedS2 = uniqueWordSeperator(s2);

  let keyLengthAvg = (seperatedS1.length + seperatedS2.length) / 2;

  let lengthWeight = keyLengthAvg <= 4 ? Math.pow(2.7, 4 - keyLengthAvg) : 1;

  let result =
    levenshtein.get(seperatedS1, seperatedS2) *
    lengthWeight * //3자리 이하면 줄임말일 가능성이 높다
    exWeigh;

  //console.log ("d : " + result)

  return result;
}

module.exports = {
  addKeywordsToProperCategory: addKeywordsToProperCategory,
  findMatchingCategory: findMatchingCategory,
  NoiseFilter: NoiseFilter,
  searchKeyword: searchKeyword
};

//  //이미 키워드가 존재 할 때
//  let maxCnt = 0;
//  for (let c of Categories) {
//    for (let keyword of c.keywords) {
//      if (keyword.key === queryKeyword) {
//        //TODO 최적화 작업을 하지 않고 그대로 카운트롤 올려버려도 되는지?
//        keyword.count++;

//        //TODO 대표 keyword를 결정하는 기준 생각해보기
//        if (c.maxCnt < keyword.count) {
//            // 대표 키워드 갱신
//            c.maxCnt = keyword.count
//            c.representation = keyword.key;
//        }
//        let result = await c.save();
//        console.log(
//          `이미 존재하는 키워드 ${result}에 대한 카운트를 증가 시켰습니다.`
//        );
//        return result;
//      }

//    }
//  }

//  //모든 카테고리들과 queryKeyword와의 Distance평균이 가장 작은 카테고리 찾기
//  let minDistCategory = await getMinDistanceCategory(
//    Categories,
//    queryKeyword,
//    isNoise
//  );

//  //최종 처리
//  if (!minDistCategory || minDistCategory.distAvg > 4) {
//    //모든 카테고리를 조회했지만 적절한 곳이 없을 때, 처음 데이터를 추가할 때

//    // ---- 새로운 카테고리 추가 ----

//    console.log("적절하게 삽입할 곳이 없습니다.");

//    var newEntity = await Category.create({
//      type: type,
//    });
//    newEntity.keywords.push({ key: queryKeyword });
//    let result = await newEntity.save();
//    console.log("새로 생성 : " + result);
//    return result;
//  } else {
//    //가장 적절한 카테고리를 찾으면 거기에 삽입

//    // ---- 기존 카테고리에 추가 ----
//    // TODO 요청받은 키워드를 기존 카테고리로 매칭 추천할 때 유의사항
//    // minDistCategory.category.representation 을 의미하는게 맞나요 ?
//    // -> Y -> minDistCategory.category.keywords.push({ key: queryKeyword })
//    // -> N -> 새로운 카테고리 생성 (기존에 추천한 카테고리가 적절하지 않음이 사람에 의해 확인 됐으니
//    //                             기존 추천한 카테고리와 요청받은 키워드 사이에 음의 가중치를 적용해서
//    //                             다음에 분류되지않도록 해야함 )
//    //         N 라고 응답한 사람수에 비례해서 새로운 카테고리로 분류할지 말지 결정해야함

//    console.log(minDistCategory);
//    minDistCategory.category.keywords.push({ key: queryKeyword });
//    let result = await minDistCategory.category.save();
//    console.log(queryKeyword + " 추가");
//    console.log("완료 : " + result.keywords);

//    //Keyword Matching 성공
//    return result;
//  }
