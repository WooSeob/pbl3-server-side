var user;
$(document).ready(()=>{
    $.ajax({
        type: 'GET',
        url: '/auth/isAuthenticated',
        dataType: "text",
        success: function(res){
            if(res == 'fail'){
                //로그인 안되있는 경우
                $('#userinfo').append(`
                    <p>
                        <a href="/login.html">Login</a><br>
                        <a href="/register.html">Sign in</a>
                    </p>
                `);
            }else{
                //로그인 되있는 경우
                user = JSON.parse(res);
                $('#userinfo').append(`
                    <h1>Hello, ${user.nickname}</h1>
                    <p>
                        <a href="/newclass.html">강좌개설</a>
                    </p>
                    <p>
                        <a href="/auth/logout">Logout</a>
                    </p>
                `);
                loadMyClasses();
            }
            loadAllClasses();
        },
        error: function(xhr, status, responseTxt){
            console.log(xhr);
        }
    });
})

function loadMyClasses(){
    $.ajax({
        type: 'GET',
        url: '/user/class/tutor',
        dataType: "json",
        success: function(res){
            if(res != 'fail'){
                // 로드 성공
                let list = '';
                for(let c of res){
                    list = list + `<li>${c.className} - ${c.tutor}</li>`
                }
                $('.asTutor ul').append(list);
            }
        },
        error: function(xhr, status, responseTxt){
            console.log(xhr);
        }
    });

    $.ajax({
        type: 'GET',
        url: '/user/class/tutee',
        dataType: "json",
        success: function(res){
            if(res != 'fail'){
                // 로드 성공
                let list = '';
                for(let c of res){
                    list = list + `<li>${c.className} - ${c.tutor} <a href="/class/${c._id}/quit">수강철회</a></li>`
                }
                $('.asTutee ul').append(list);
            }
        },
        error: function(xhr, status, responseTxt){
            console.log(xhr);
        }
    });
}

function loadAllClasses(){
    $.ajax({
        type: 'GET',
        url: '/class/name/all',
        dataType: "json",
        success: function(res){
            if(res != 'fail'){
                // 로드 성공
                let list = '';
                for(let c of res){
                    list = list + `<li>${c.className} (${c.tutor}) - <a href="/class/${c._id}/join">수강하기</a></li>`
                }
                $('.all ul').append(list);
            }
        },
        error: function(xhr, status, responseTxt){
            console.log(xhr);
        }
    });
}