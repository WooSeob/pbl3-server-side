var user;

const TYPE_TO_STRING = {
    'RealtimeOnlineCourseType': '커리큘럼 온라인 실시간',
    'OnlineCourseType': '커리큘럼 온라인 실시간X',
    'QnAType': '질의응답형',
    'OfflineType': '오프라인 수업' 
}

function loadType(classData){
    return `
    <h3>수업 유형</h3>
    <div>${TYPE_TO_STRING[classData.classType]}</div>`
}
function loadGrade(classData){
    return `
    <h3>성적 인증</h3>
    <div>${classData.basicInfo.grade}</div>`
}
function loadDesc(classData){
    return `
    <h3>수업 설명</h3>
    <div>${classData.basicInfo.description}</div>`
}
function loadCourses(classData){
    let result = `
    <h3>강의 커리큘럼</h3>
    <ul>`
    for(let course of classData.course){
        result += `<li>${course.description}, 링크 : ${course.link}</li>`
    }
    result+= `</ul>`
    return result;
}
function loadLectureTime(classData){
    let result = `
    <h3>수업시간</h3>
    매주
    <ul>`
    for(let time of classData.lectureTime){
        result += `<li>${time.startAt}부터, ${time.duration}시간</li>`
    }
    result+= `</ul>`
    return result;
}
function loadDashBoard(classData, next){
    let dashBoard = `<h2>수업 대시보드</h2>`
    //공통부분불러오기
    dashBoard += loadType(classData);
    dashBoard += loadGrade(classData);
    dashBoard += loadDesc(classData);

    //타입별로 다른부분불러오기
    for(func of next){
        dashBoard += func(classData);
    }
    return dashBoard;
}

const LoadClass = {
    'RealtimeOnlineCourseType': (classData)=>{
        //커리큘럼 온라인 실시간
        let dashBoard = loadDashBoard(classData, [loadCourses, loadLectureTime])
        $('#dashboard').html(dashBoard)
    },

    'OnlineCourseType': (classData)=>{
        //커리큘럼 온라인 실시간X
        let dashBoard = loadDashBoard(classData, [loadCourses])
        $('#dashboard').html(dashBoard)
    },

    'QnAType': (classData)=>{
        //질의응답형
        let dashBoard = loadDashBoard(classData, [loadLectureTime])
        $('#dashboard').html(dashBoard)
    },

    'OfflineType' : (classData)=>{
        //오프라인형
        let dashBoard = loadDashBoard(classData, [loadCourses, loadLectureTime])
        $('#dashboard').html(dashBoard)
    }
}


$('#go').click(()=>{
    console.log('button clicked')

    $.ajax({
        type: "GET",
        url: "/class/" + $('#className').val(),
        dataType: "json",
        success: (res)=>{
            if(res != 'fail'){
                //강의정보 불러오기 성공
                classData = res[0];
                console.log(classData.className)
                $('#classRoomTitle').html(classData.className);

                //강의 타입별로 강의실 불러오기
                LoadClass[classData.classType](classData);
            }
        },
        error: (xhr, status, responseTxt)=>{
            console.log(xhr);
        }
    })

})
