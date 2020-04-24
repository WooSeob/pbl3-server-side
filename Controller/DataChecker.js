const IS_DATA_PREPARED = {
    'RealtimeOnlineCourseType': function(Class){
        // 커리큘럼 온라인 실시간형 수업의 Open을위한 최소 정보
        // 기본정보 + 강의시간 + 커리큘럼 + 최대튜티수
        return Class.basicInfo && Class.lectureTime.length > 0 && Class.course.length > 0 && Class.maxTutee
    },
    'OnlineCourseType': function(Class){
        // 기본정보 + 커리큘럼
        return Class.basicInfo && Class.course.length > 0
    },
    'QnAType': function(Class){
        // 기본정보 + 강의시간
        return Class.basicInfo && Class.lectureTime.length > 0
    },
    'OfflineType': function(Class){
        // 기본정보 + 강의시간 + 최대튜티수 + 수업장소 + (커리큘럼 있어도 되고 없어도됨)
        return Class.basicInfo  && Class.lectureTime.length > 0 && Class.maxTutee && Class.place
    }
}

const DATA_TYPE = {
    //기본정보는 모든 강의들이 추가될 수 있습니다.
    'BasicInfo': ['RealtimeOnlineCourseType', 'OnlineCourseType', 'QnAType', 'OfflineType'],
    //커리큘럼 정보는 아래와같은 ClassType 들에게만 추가될 수 있습니다.
    'Course': ['RealtimeOnlineCourseType', 'OnlineCourseType', 'OfflineType'],
    'LectureTime': ['RealtimeOnlineCourseType', 'QnAType', 'OfflineType'],
    'MaxTutee': ['RealtimeOnlineCourseType', 'OfflineType'],
    'SkypeLink': ['RealtimeOnlineCourseType'],
    'Place': ['OfflineType']
}

module.exports = {
    isDataPrepared: function(Class){
        return IS_DATA_PREPARED[Class.classType](Class)
    },
    isAccessible: function(dataType, classType){
        return DATA_TYPE[dataType].includes(classType)
    },
}

