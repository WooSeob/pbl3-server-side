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
    }),
  ],
  maxCnt: {
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
  for(let keyword of this.keywords){
    if(this.maxCnt <= keyword.count){
      this.maxCnt = keyword.count
      this.representation = keyword.key
    }
  }
});

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
