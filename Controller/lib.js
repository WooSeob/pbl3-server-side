const levenshtein = require("fast-levenshtein");
class WordGraph {
  constructor(keywords) {
    this.keywords = keywords;

    //그래프생성
    this.edges = new Array();
    for (let i = 0; i < keywords.length - 1; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        let Weights = [
          new feedbackWeight(keywords[i], keywords[j]),
          new exWeight(keywords[i], keywords[j]),
          new lengthWeight(keywords[i], keywords[j]),
        ];

        let newEdge = {
          vertex1: {
            keyword: keywords[i].key,
            index: i,
          },
          vertex2: {
            keyword: keywords[j].key,
            index: j,
          },
          distance: calcDistance(keywords[i], keywords[j], Weights),
        };
        this.edges.push(newEdge);
      }
    }

    //정렬
    this.edges.sort((a, b) => {
      return a.distance > b.distance ? 1 : -1;
    });

    this.DistanceSum = 0;
    for (let edge of this.edges) {
      this.DistanceSum += edge.distance;
    }

    this.Threshold = this.DistanceSum / this.edges.length - 1;

    this.noiseIndex = this.edges.length - this.keywords.length + 1;

    console.log("WORD_GRAPH : 그래프생성완료 " + this);
  }

  getNoiseIndex() {
    return this.noiseIndex;
  }

  getGraphInfo() {
    console.log(this.edges)
    console.log(
      "NoiseDist : " +
        this.edges[this.noiseIndex].distance +
        ", Threshod : " +
        this.Threshold
    );
  }

  getNoiseEdge() {
    return this.edges[this.noiseIndex];
  }

  isNoiseDetected() {
    return (
      this.Threshold != 0 && this.getNoiseEdge().distance >= this.Threshold
    );
  }
  //3분위수
  // let Q3 =
  //   wordGraph.edges.length >= 6
  //     ? wordGraph.edges.length * 0.75
  //     : wordGraph.edges.length / 2;
  // let Q3s = wordGraph.length >= 6 ? Math.floor(Q3) - 1 : Math.floor(Q3);
  //3분위수(Distance)
  //TODO 역치값 최적화
  //wordGraph[Q3s].distance * 0.75 + wordGraph[Q3s + 1].distance * 0.25;
}

class Weight {
  constructor() {}

  getWeighted(value) {
    // console.log(`${value} * ${this.weight} = ${value*this.weight}`)
    return value * this.weight;
  }
}

class categoryFeedbackWeight extends Weight {
  constructor(feedback) {
    super();
    this.weight = Math.pow(1.3, -feedback);
    // console.log(`${this} weight : ${this.weight}`)
  }
}
class feedbackWeight extends Weight {
  constructor(keyword1, keyword2) {
    super();
    this.weight = Math.pow(2.7, -Math.min(keyword1.feedback, keyword2.feedback));
    // console.log(`${this} weight : ${this.weight}`)
  }
}

class exWeight extends Weight {
  constructor(keyword1, keyword2) {
    super();
    this.weight = exCompare(keyword1.key, keyword2.key) ? 0.01 : 1;
    // console.log(`${this} weight : ${this.weight}`)
  }
}

class exsWeight extends Weight {
  //줄임말 가중치 - 줄임말에 해당하는 단어가 많을수록 Distance를
  //매우 작게 만들어 해당 카테고리로 분류되도록
  constructor(exCnt) {
    super();
    this.weight = Math.pow(10, -exCnt);
    // console.log(`${this} weight : ${this.weight}`)
  }
}

class lengthWeight extends Weight {
  constructor(keyword1, keyword2) {
    super();
    let S1 = uniqueWordSeperator(keyword1.key);
    let S2 = uniqueWordSeperator(keyword2.key);
    let keyLengthAvg = (S1.length + S2.length) / 2;
    this.weight = keyLengthAvg <= 4 ? Math.pow(2.7, 4 - keyLengthAvg) : 1;
    // console.log(`${this} weight : ${this.weight}`)
  }
}

class countWeight extends Weight {
  //한 키워드와 한 카테고리간의 Distance평균을 구할 때
  //카테고리 내 키워드의 영향력은 그 키워드의 count에 비례한다
  //=> 한 키워드와 카테고리 내 한 키워드의 Distance  * 그 키워드의count/전체count
  constructor(keywordCnt, sumCnt) {
    super();
    this.weight = keywordCnt / sumCnt;
    // console.log(`${this} weight : ${this.weight}`)
  }
}

//keywordsLengthWeight
//대상 카테고리 키워드 리스트 길이 가중치
// - 한 카테고리를 지칭하는 단어가 많을 가능성이 적다

class categoryLengthWeight extends Weight {
  //전체 카테고리 수 가중치 - 전체 카테고리들의 수가 적을수록 dS커지게
  constructor(Categorieslength) {
    super();
    this.weight =
      Categorieslength <= 10 ? Math.pow(1.1, 10 - Categorieslength) : 1;
    //   console.log(`${this} weight : ${this.weight}`)
  }
}
class noiseWeight extends Weight{
    constructor(){
        super()
        this.weight = 2
        // console.log(`${this} weight : ${this.weight}`)
    }
}
class FeedBack {
  //1. 기존 카테고리에서 노이즈 필터링으로 제거되서 넘어온 경우
  //   //   - 기존에 있던 카테고리에 다시 배치될 가능성을 낮추기 위해 Distance를 2배 해준다.
  //   //2. 검색 결과에 대한 피드백으로서 받은 가중치를 적용해 준다.
  //   //   - 검색결과가 정확할 때 : Weight > 1 Distance를 크게 만들어 원래 카테고리에 배치될 가능성을 낮춤
  //   //   - 검색결과가 부정확할 때 : Weight < 1
  constructor(target, Weights) {
    this.target = target;
    this.weights = Weights;
  }

  getFeedbacked(category, value) {
    let result = value;
    if (String(category._id) == String(this.target._id)) {
      this.weights.forEach( w => {
        result *= w.getWeighted(result);
      });
    }
    return result;
  }
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
function calcDistance(k1, k2, Weights) {
    //console.log("\n "+ s1 + " - " + s2)
    let s1 = k1.key
    let s2 = k2.key
  
    //피드백 가중치
    //Keyword1과 Keyword2 사이 피드백값중 작은 값을 택한다.
    //값이 음수일때 그 키워드는 해당 카테고리에 부적합하다고 피드백 받은것이기 때문에
    //절대값에 비례하게 Distance값을 높여서 해당 카테고리에서 벗어날 가능성을 높인다
  
    //3자리 이하면 줄임말일 가능성이 높다
    let seperatedS1 = uniqueWordSeperator(s1);
    let seperatedS2 = uniqueWordSeperator(s2);
  
    let result = levenshtein.get(seperatedS1, seperatedS2);
    // console.log("calcDistance(1) : " + result)

    Weights.forEach(element => {
      result = element.getWeighted(result)
    });
  
    // console.log("calcDistance(2) : " + result);
    return result;
}

module.exports = {
  WordGraph,
  categoryFeedbackWeight,
  feedbackWeight,
  exWeight,
  exsWeight,
  lengthWeight,
  countWeight,
  categoryLengthWeight,
  noiseWeight,
  FeedBack,
  
  uniqueWordSeperator,
  exCompare,
  calcDistance
}
