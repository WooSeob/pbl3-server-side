var DataChecker = require('./DataChecker')
var ClassConst = require('../Const/Class')

const Manager = {
    checkPrepared : function(Class){
        //강의 준비완료됬는지 확인하기
        //Prepare -> Joinable
        if(Class.state == ClassConst.state.PREPARE){
            if(DataChecker.isDataPrepared[Class.classType](Class)){
                Class.state = ClassConst.state.JOIN_ABLE
                Class.save(()=>{
                    console.log(Class._id + ' : state changed (Prepare -> Joinable)')
                })
            }else{
                console.log('데이터가 모두 준비되지 않았습니다.')
            }
        }else{
            console.log('수업 상태가 Prepare가 아닙니다.')
        }
    },
    startLecture: function(Class, next){
        //강의 시작(더이상 수강신청 허용하지 않음)하기
        //Joinable -> InProgress
        if(Class.state == ClassConst.state.JOIN_ABLE && Class.tutees.length >= ClassConst.MIN_TUTEE){
            Class.state = ClassConst.state.IN_PROGRESS
            Class.save(()=>{
                    console.log(Class._id + ' 강의시작');
                    next(null);
                })
        }else{
            next('강의를 시작 할 수 없습니다.');
        }
    },
    endLecture: function(Class, next){
        //폐강
        //Joinable || InProgress -> Ended
        if(Class.state == ClassConst.state.JOIN_ABLE 
            ||Class.state == ClassConst.state.IN_PROGRESS){
            Class.state = ClassConst.state.ENDED
            Class.save(()=>{
                    console.log(Class._id + ' 종료');
                    next(null);
                })
        }else{
            next('강의를 종료 할 수 없습니다.');
        }
    }
}

module.exports = Manager