var mongoose = require("mongoose");

//메일 인증
const MailAuthSchema = new mongoose.Schema({
  webmail: String,
  authNum: Number,
  isAuth: Boolean
  // sended : Date
});

const Mail = mongoose.model("Mail", MailAuthSchema);
module.exports = Mail;
