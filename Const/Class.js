const STATE = {
    PREPARE: 'Prepare',
    JOIN_ABLE: 'Joinable',
    IN_PROGRESS: 'InProgress',
    ENDED: 'Ended'
}

const MIN_TUTEE = 1

const DATA_COMPLETE_CONDITION_BY_CLASS_TYPE = {
    'RealtimeOnlineCourseType': function(Class){
        // 커리큘럼 온라인 실시간형 수업의 Open을위한 최소 정보
        // 기본정보 + 강의시간 + 커리큘럼 + 최대튜티수
        return Class.basicInfo && Class.lectureTimes.length > 0 && Class.courses.length > 0 && Class.maxTutee
    },
    'OnlineCourseType': function(Class){
        // 기본정보 + (커리큘럼 있어도 되고 없어도 됨)
        return Class.basicInfo //&& Class.courses.length > 0
    },
    'QnAType': function(Class){
        // 기본정보 + 강의시간
        return Class.basicInfo && Class.lectureTimes.length > 0
    },
    'OfflineType': function(Class){
        // 기본정보 + 강의시간 + 최대튜티수 + 수업장소 + (커리큘럼 있어도 되고 없어도됨)
        return Class.basicInfo  && Class.lectureTimes.length > 0 && Class.maxTutee && Class.place
    }
}

const DATA_ACCESS_PERMISSION_BY_CLASS_TYPE = {
    //Key 에 해당하는 정보는 Value들(ClassType)에 해당하는 강의들에게만 추가될 수 있습니다.
    'BasicInfo': ['RealtimeOnlineCourseType', 'OnlineCourseType', 'QnAType', 'OfflineType'],
    'Course': ['RealtimeOnlineCourseType', 'OnlineCourseType', 'OfflineType'],
    'LectureTime': ['RealtimeOnlineCourseType', 'QnAType', 'OfflineType'],
    'MaxTutee': ['RealtimeOnlineCourseType', 'OfflineType'],
    'SkypeLink': ['RealtimeOnlineCourseType'],
    'Place': ['OfflineType'],

    'Question': ['RealtimeOnlineCourseType', 'OnlineCourseType', 'QnAType', 'OfflineType'],
    'Answer': ['RealtimeOnlineCourseType', 'OnlineCourseType', 'QnAType', 'OfflineType'],

    'LectureNote': ['RealtimeOnlineCourseType', 'OfflineType'],

    'Attendance': ['RealtimeOnlineCourseType', 'OnlineCourseType', 'QnAType', 'OfflineType'],

    'chattingRoom': ['QnAType']
}

module.exports = {
    state: STATE,
    MIN_TUTEE: MIN_TUTEE,
    //수업을 OPEN하기 위한 정보가 모두 준비 됬는지
    isDataPrepared: function(Class){
        return DATA_COMPLETE_CONDITION_BY_CLASS_TYPE[Class.classType](Class)
    },
    //해당 데이터 타입이 해당 클래스 타입에 접근할 수 있는지
    isAccessible: function(dataType, classType){
        if(DATA_ACCESS_PERMISSION_BY_CLASS_TYPE[dataType]){
            return DATA_ACCESS_PERMISSION_BY_CLASS_TYPE[dataType].includes(classType)
        }else{
            console.log(LogString + dataType + '타입에 대한 정보가 없습니다.')
            return false
        }
    }
};