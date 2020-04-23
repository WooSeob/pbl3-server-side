var mongoose = require('mongoose');
var Class = require('./Schemas/Class');
var User = require('./Schemas/User');

const test1 = {
    setStateToClass : function(){
        Class.find({}, (err, found)=>{
            console.log(found)
            for(let Class of found){
                if(!Class.state){
                    let state = 'Prepare'
                    if(Class.classType == 'OnlineCourseType'){
                        state = 'InProgress'
                    }
                    Class.state = state
                    Class.save(()=>{
                        console.log(Class.className + '저장완료')
                    })     
                }
            }
        })
    }
}

module.exports = test1;