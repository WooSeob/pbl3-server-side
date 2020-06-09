
var mongoose = require('mongoose');

// DB 연결
mongoose.connect('mongodb://localhost:27017/test',{
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
  console.log("Connection to mongoDB");
});

db.dropCollection('classes', function(err, result) {console.log("클래스 삭제")});
db.dropCollection('users', function(err, result) {console.log("유저 삭제")});
db.dropCollection('mails', function(err, result) {console.log("메일 삭제")});
db.dropCollection('sessions', function(err, result) {console.log("세션 삭제")});
db.dropCollection('lecturedemands', function(err, result) {console.log("강의 수요 삭제")});