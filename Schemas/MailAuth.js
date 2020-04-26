var mongoose = require('mongoose');

//메일 인증 
const MailAuthSchema = new mongoose.Schema({
    webmail: String,
    authNum: Number
});

/* 똥망 코드 ~ 
MailAuthSchema.statics.returnAuthnum = function(userEmail){
    if(this.webmail.includes(userEmail)){
        console.log(this.authNum+"@@@@@@@@@@@")
        return this.authNum;
    } else{
        return false;
    }

}


MailAuthSchema.statics.deleteInfo = function(userEmail){
    if(Mail.findOne({webmail:userEmail}) === true){
        Mail.findOneAndDelete({webmail:userEmail}, function(err, result){
            callback({
                message:"Successfully deleted mail",
                book: result
            });
        });
    }
}



MailAuthSchema.methods.compareAuthNum = function(userInput) {
    
    if(this.authNum === userInput){
        console.log("!!!인증성공!!!")
    } else {
        console.log("인증 실패다 이자식아!")
    }
};

*/

const Mail = mongoose.model("Mail", MailAuthSchema);
module.exports = Mail;