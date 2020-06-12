var mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["MAJOR", "INTERESTS"],
  },
  representation: String,
  keywords: [
    new mongoose.Schema({
      key: String,
      count: {
        type: Number,
        default: 1,
      },
      feedback: {
        type: Number,
        default: 0,
      },
    }),
  ],
  maxCnt: {
    type: Number,
    default: 0
  },
  sumCnt: {
    type: Number,
    default: 0
  },
  subItems: [
    new mongoose.Schema({
      representation: String,
      keywords: [
        {
          type: String,
        },
      ],
    }),
  ],
});

CategorySchema.pre('save', async function() {
  //대표어 갱신
  let sumCnt = 0;
  //TODO 최고 카운트였던 키워드 카운트가 내려갈때 maxCnt 다시찾게
  for(let keyword of this.keywords){
    if(this.maxCnt <= keyword.count){
      this.maxCnt = keyword.count
      this.representation = keyword.key
    }

    sumCnt += keyword.count
  }
  this.sumCnt = sumCnt

});

CategorySchema.methods.getKeys = function(){
  let keys = []
  for (let keyword of this.keywords) {
    keys.push(keyword.key)
  }
  return keys
}

CategorySchema.methods.CountUp = async function(key){
  console.log("카운트업")
  console.log(key)
  for (let keyword of this.keywords) {
    if(keyword.key == key){
      keyword.count++
    }
  }
  let result = await this.save()
  console.log(result)
}

CategorySchema.methods.CountDown = async function(key){
  console.log("카운트다운")
  console.log(key)
  for (let keyword of this.keywords) {
    if(keyword.key == key){
      keyword.count--
    }
  }
  let result = await this.save()
  console.log(result)
}

CategorySchema.statics.getAllItems = async function () {
  let Item = [];
  await this.find({}, (err, found) => {
    //console.log(found)
    Item = found;
  });
  return Item;
};

CategorySchema.statics.getItemsByType = async function (type) {
  let Item = [];
  await this.find({ type: type }, (err, found) => {
    //console.log(found)
    Item = found;
  });
  return Item;
};

CategorySchema.statics.getMajors = async function () {
  let Majors;
  await this.find({ type: "MAJOR" }, (err, found) => {
    //console.log(found)
    Majors = found;
  });
  return Majors;
};

CategorySchema.statics.getInterests = async function () {
  let Interests;
  await this.find({ type: "INTERESTS" }, (err, found) => {
    //console.log(found)
    Interests = found;
  });
  return Interests;
};

module.exports = CategorySchema;
