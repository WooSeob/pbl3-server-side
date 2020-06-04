const mongoose = require("mongoose");
const LOG_STRING = "CategoryManager.js : ";
const ClassStateManager = require("./ClassStateManager");
const Category = mongoose.model("Category", require("../Schemas/Category"));
const levenshtein = require("fast-levenshtein");

//Get
//해당 Type의 모든 카테고리 종류들을 반환
async function getAllCategoriesByType(type) {
  let Items = await Category.getItemsByType(type);
  let List = new Array();

  for (let i of Items) {
    List.push(i.keywords);
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
async function addCategory(type, newCategory) {
  //TODO 성능 최적화 할것
  //TODO 요청 받은 keyword == 기존 어떤 카테고리에 있는 keyword 일때 그냥 리턴!!!!
  console.log("\n 카테고리 최적화 시작");
  let Categories = await Category.getItemsByType(type);

  for await (let c of Categories) {
    let keywords = c.keywords;
    //카테고리 하나에 대한 Distance가중치 무향 완전그래프 생성
    //O(N^2)  * N = keywords.length
    if (keywords.length >= 2) {
      // console.log("## 노이즈 체크시작 ##")
      let noiseKeyword = await noiseFilter(type, c);
      if (noiseKeyword) {
        console.log("-- 노이즈 다른곳에 추가 --");
        await addKeyword(type, Categories, noiseKeyword);
      }
    }
  }
  //   console.log("addCategory 에서 addKeyword 호출")
  console.log(newCategory + " 추가 시작");
  addKeyword(type, Categories, newCategory);
}

function addSubItemToCategory(type, newItem) {
  //Type의 기존 카테고리에 새로운 subItem을 추가
  //ex. {"컴퓨터구조", "컴구", "컴구조", "구조", ....... } => "컴퓨터구조"
  // 기존에 데이터가 없음애도 불구하고 최적의 추천값을 찾아서 그 추천값으로 보정해야함
}
async function addKeyword(type, Categories, newCategory) {
  // TODO 노이즈 제거작업을 통해서 호출받았을때 가중치 파라미터를 전달받아서 노이즈 제거되기 전에 있던 기존 그룹으로 다시 못가도록 처리할것
  let similar = new Array();

  for (let c of Categories) {
    // @c DB내 여러 카테고리들중 하나
    let dS = 0;
    let exWeigh = 1;
    let exCnt = 0;
    //하나의 카테고리에 대해
    for (let keyword of c.keywords) {
      //keyword - newCategory 가 서로 줄임말일 경우 가중치 up
      if (exCompare(keyword, newCategory)) {
        exCnt++;
      }
      // 비교하는 두 문자열 크기의 차이
      let keyLengthAvg =
        (uniqueWordSeperator(keyword).length +
          uniqueWordSeperator(newCategory).length) /
        2;
      let lengthWeight =
        keyLengthAvg <= 4 ? Math.pow(2.7, 4 - keyLengthAvg) : 1;
      //Distance 합산
      dS +=
        levenshtein.get(
          uniqueWordSeperator(keyword),
          uniqueWordSeperator(newCategory)
        ) * lengthWeight;
    }
    exWeigh = Math.pow(10, -exCnt);
    //console.log(exWeigh)

    let categoryLengthWeight =
      Categories.length <= 10 ? Math.pow(1.1, 10 - Categories.length) : 1;
    dS =
      dS != 0
        ? (dS / c.keywords.length) *
          Math.pow(2.718, c.keywords.length - 2) * //대상 키워드수
          //* Math.pow(1.2, 5 - newCategory.length) //새로 추가하려는 카테고리 글자수
          categoryLengthWeight * //전체 카테고리들의 수가 적을수록 dS커지게
          exWeigh
        : 0;
    // console.log("distAvg : " + dS);
    similar.push({
      category: c,
      distAvg: dS,
    });
  }

  similar.sort((a, b) => {
    return a.distAvg > b.distAvg ? -1 : 1;
  });

  let minDistCategory = similar.pop();
  //   console.log(minDistCategory)
  //넣을곳이 없으면 걍 새로만든다
  if (minDistCategory) {
    console.log();
    for (let s of similar) {
      console.log(s);
    }
    console.log("minDistAvg : " + minDistCategory.distAvg);
    if (minDistCategory.distAvg > 4) {
      //모든 카테고리를 조회했지만 적절한 곳이 없을 때
      console.log("적절하게 삽입할 곳이 없습니다.");
      var newEntity = await Category.create({
        type: type,
      });
      newEntity.keywords.push(newCategory);
      let temp = await newEntity.save();
      console.log("새로 생성 : " + temp);
    } else {
      //가장 적절한 카테고리를 찾으면 거기에 삽입
      minDistCategory.category.keywords.push(newCategory);
      let temp = await minDistCategory.category.save();
      console.log(newCategory + " 추가");
      console.log("완료 : " + temp.keywords);
    }
  } else {
    //기존 데이터가 없을 때
    var newEntity = await Category.create({
      type: type,
    });
    newEntity.keywords.push(newCategory);
    let temp = await newEntity.save();
    console.log("새로 생성 : " + temp);
  }
  //   console.log("addKeyword 리턴")
}
async function noiseFilter(type, category) {
  // console.log("noiseFilter 호출")
  let keywords = category.keywords;

  let wordGraph = new Array();
  //카테고리 하나에 대한 Distance가중치 무향 완전그래프 생성
  for (let i = 0; i < keywords.length - 1; i++) {
    for (let j = i + 1; j < keywords.length; j++) {
      let newEdge = {
        vertex1: {
          keyword: keywords[i],
          index: i,
        },
        vertex2: {
          keyword: keywords[j],
          index: j,
        },
        distance: calcDistance(keywords[i], keywords[j]),
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

    let noiseKeyword = wordGraph[noiseIndex].vertex2.keyword;

    keywords.splice(searchKeyword(keywords, noiseKeyword), 1);
    console.log("제거결과 : " + keywords);
    category.keywords = keywords;
    let result = await category.save();
    // console.log("제거 결과 : " + result)
    // console.log("noiseFilter 리턴")
    return noiseKeyword;
  } else {
    // console.log("noiseFilter 리턴")
    return null;
  }
}
function searchKeyword(arr, keyword) {
  for (let key in arr) {
    if (arr[key] === keyword) {
      return key;
    }
  }
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

module.exports = {
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
  test: {
    exCompare: exCompare,
    uniqueWordSeperator: uniqueWordSeperator,
  },
};

// async function addCategory(type, newCategory) {
//     //TODO 파라미터 보정 알고리즘
//     //ex. {"액티비티", "엑티비티", "", "알고", ....... } => "알고리즘"
//     //위 보정 작업은 기존에 데이터가 없는데 해야함...
//     const THRESHOLD = 2
//     console.log("similarity with " + newCategory)

//     let similar = new Array();
//     let Categories = await Category.getItemsByType(type)

//     for(let c of Categories){

//         //줄임말이면 종료
//         if(exCompare(c.name, newCategory)){
//             console.log(`${newCategory}는 ${c.name}의 줄임말 이므로 추가하지 않습니다.`)
//             return
//         }
//         similar.push({
//             category: c,
//             distance: levenshtein.get(c.name, newCategory)
//         })
//     }

//     //Distance 내림차순 정렬
//     similar.sort((a,b)=>{
//         if(a.distance > b.distance){
//             return -1
//         }else if(a.distance < b.distance){
//             return 1
//         }else{
//             // Distance가 같다면 단어를 줄여쓰는 언어습관상
//             // 앞글자가 같은 원소를 더 끝쪽으로 정렬한다.
//             return (a.category.name.substring(0,1) != newCategory.substring(0,1)) ? -1 : 1
//         }
//     })

//     //Distance가 가장 작은녀석
//     let minDistCategory = similar.pop()
//     console.log(minDistCategory)

//     //Distance가 가장 작은 녀석인데도 기준(3) 초과면
//     if(minDistCategory.distance > THRESHOLD){
//         // 추가한다.
//         console.log(`${newCategory}를 추가합니다.`)
//         Category.create({
//             type: type,
//             name: newCategory
//         })
//     }else{
//         // 유사도가 충분하다고 판단
//         console.log(`${newCategory}는 ${minDistCategory.category.name}을 의미하는 것으로 추측됩니다.`)
//     }
// }
