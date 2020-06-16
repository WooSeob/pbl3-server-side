var mongoose = require("mongoose");
const levenshtein = require("fast-levenshtein");
const cm = require("./Controller/CategoryManager");
const FS = require('fs');


// DB 연결
mongoose.connect("mongodb://localhost:27017/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testData = [
  //DB에 데이터들이 모여있을때 아래 데이터들을 추가해서 어떻게 분류되는지 확인할
  "김기웅학우"
];

const mDatas = [
  //Training
  "컴퓨터공학과",
  "컴퓨터",

  "전기전자제어공학과",
  "전전제",

  "미디어문예창작학과",
  "미디어문예창작",

  "미문창",
  "미디어",

  "기계공학과",
  "기계",

  "화학공학과",
  "화학",

  "토목안전환경공학과",
  "토안환",

  "디자인학과",
  "디자인",

  "식물생명공학과",
  "식물생명",
  "식물",

  "동물생명공학과",
  "동물",

  "경영학과",
  "경영",

  "법학과",
  "법학",

  "행정학과",
  "행정학",

  // 검증1 - 관련 데이터 기존에 있는경우 -> 기존카테고리로 투입
  "동물생명",
  "식생공",
  "토목안전환경",
  "화공",
  "기계공",
  "컴퓨타",
  "전기전자",
  "컴공",

  //검증2 - 관련데이터가 전혀 없는경우 -> 새로운 카테고리 만들어져야함
  "영어학과",
  "조경학과",
];

const iDatas = [
  "엑셀",
  "액셀",
  "댄스",
  "덴스",
  "메이크업",
  "매이크업",
  "메이크엎",
  "포토샵",
  "포토샾",
  "포토",
  "방송댄스",
  "방송덴스",
  "보컬",
  "애프터이펙트",
  "에프터이팩트",
  "에프로이펙트",
  "웹개발",
  "개발",
  "앱개발",
  "영어",
  "영어회화",
  "중국어",
  "중국어회화",
  "패션",
  "페션",
  "액티비티",
  "엑티비티",
];

//데이터 셋 설정은 아래 DATA 를 수정할것
var cnt = 0;

const db = mongoose.connection;
db.on("error", console.error);
db.once("open", async function () {
  console.log("Connection to mongoDB");

  const Category = mongoose.model("Category", require("./Schemas/Category"));
  Category.init()
  .then(()=>{
    // 비동기 호출 문제 때문에 setTimeout으로 호출하고있음

    FS.readFile('categoryData.json', 'utf8', async function(err, data){
      let Data = JSON.parse(data).datas
      console.log(Data)
      for (let i = 0; i < Data.length; i++){
        let result = await cm.Major.addCategory(Data[i])
      }
    });
    
    // for (let i = 0; i < DATA.length; i++) {
    //   console.log("타임아웃설정 " + DATA[i]);
    //   setTimeout(test1, 1000 * i);
    // }
    // searchOptimization()
    // console.log(await cm.Major.get())
  })  
});

async function searchOptimization(){
  let result
  result = await cm.searchOptimization(true, testData[0], {
    categoryID: "5edd334d774f4b2df8b2ace0",
    accurate: false
  })
  console.log(result)
}

async function search(){
  let result = await cm.Search(DATA[cnt++])
  console.log("검색결과 매칭 : " + result.isMatched + ", 가장 유사한 카테고리 : " + result.minDistCategory)
}

async function test1() {
  console.log("\n--------------키워드 추가 시작----------------");
  //아래 함수 파라미터 값으로 카테고리 추가 할 수 있음
  await cm.Major.addCategory(DATA[cnt++]);
}

async function test2() {
  cm.Interests.addCategory(iDatas[cnt++]);
}
