var mongoose = require("mongoose");

//메일 인증
const MailAuthSchema = new mongoose.Schema({
  webmail: String,
  authNum: Number,
  isAuth:{type:Boolean, default:false}
});

const Mail = mongoose.model("Mail", MailAuthSchema);
module.exports = Mail;
