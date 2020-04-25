var mongoose = require('mongoose');

//메일 인증 
const MailAuthSchema = new mongoose.Schema({
    webmail: String,
    authNum: Number
    
    /* createdAt: {
        type: Date,
        default: Date.now
    },
    */
   
});

// MailAuthSchema.statics.deleteInfo = function(email, Callback){
//     this.find
// }


MailAuthSchema.statics.alertThisEmail = function(){
    return this.webmail;
};


MailAuthSchema.statics.alertThisNum = function(){
    return this.authNum;
};

module.exports = MailAuthSchema;