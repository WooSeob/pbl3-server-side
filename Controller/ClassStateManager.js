var ClassConst = require('../Const/Class')

const Manager = {
    checkPrepared: function(Class){
        //강의 준비완료됬는지 확인하기
        //Prepare -> Joinable
        if(Class.state == ClassConst.state.PREPARE){
            if(ClassConst.isDataPrepared(Class)){
                Class.state = ClassConst.state.JOIN_ABLE
                Class.save(()=>{
                    console.log(Class._id + ' : state changed (Prepare -> Joinable)')
                })
            }else{
                console.log('StateManager : 데이터가 모두 준비되지 않았습니다.')
            }
        }else{
            console.log('StateManager : 수업 상태가 Prepare가 아닙니다.')
        }
    },
    startLecture: function(Class, next){
        //강의 시작(더이상 수강신청 허용하지 않음)하기
        //Joinable -> InProgress
        if(Class.classType == 'RealtimeOnlineCourseType' || Class.classType == 'OfflineType'){
            if(Class.state == ClassConst.state.JOIN_ABLE && Class.tutees.length >= ClassConst.MIN_TUTEE){
                Class.state = ClassConst.state.IN_PROGRESS
                Class.save(()=>{
                        console.log(Class._id + ' 강의시작. 더이상 새로운 튜티의 강의 참여를 허용하지 않습니다.');
                        next(null);
                    })
            }else{
                next('강의를 시작 할 수 없습니다.');
            }
        }else{
            next('동영상형 또는 질의응답형은 InProgress 상태를 지원하지 않습니다.')
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
    },
    isClassOpenable: function(Class){
        if(Class.classType == 'RealtimeOnlineCourseType' || Class.classType == 'OfflineType'){
            //커리큘럼 온라인 실시간형과 오프라인형의 경우 InProgress 상태에서만 수업을 시작할 수 있다.
            return Class.state == ClassConst.state.IN_PROGRESS
        }else{
            //동영상강의형과 질의응답형은 In_Progress 상태가 없으므로 Joinable상태에서 수업을 시작 할 수 있다.
            return Class.state == ClassConst.state.JOIN_ABLE
        }
    }
}

module.exports = Manager