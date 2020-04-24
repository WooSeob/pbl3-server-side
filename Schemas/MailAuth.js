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

module.exports = MailAuthSchema;