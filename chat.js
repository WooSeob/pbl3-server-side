const mongoose = require("mongoose");
const Class = require("./Schemas/Class");
const User = require("./Schemas/User");
const ChatLog = mongoose.model("ChatLog", require("./Schemas/ChatLog"));

function getTime(time) {
  let now = new Date();
  now.setTime(time);

  let timeString = "";

  timeString = now.getHours() < 12 ? "오전" : "오후";

  if (now.getHours() >= 13) {
    timeString += " " + (now.getHours() - 12);
  } else {
    timeString += " " + now.getHours();
  }

  timeString += "." + now.getMinutes() + "." + now.getSeconds();
  return timeString;
}

//TODO chat
// - 버그수정
// - room을 통한 수업별 채팅방 구현 ->수업 시작과 연동
// - 데이터베이스 연동

//TODO 잘못된 접근 대응하기

module.exports = {
  getHandler: function (_io) {
    const io = _io;

    const handler = function (socket) {
      let RoomID 

      // 접속한 클라이언트의 정보가 수신되면
      socket.on("join", async function (data) {
        if (!socket.username) {
          // 전달받은 클라이언트 정보를 저장
          RoomID = data.room;
          socket.userID = data.userID;

          //접속한 유저 찾기
          User.findById(data.userID, (err, user)=>{
            if(err){console.log(err); return;}

            if(user == null){
              //TODO 접속시도한 유저 정보 잘못되 있을 떄 대응하기
              console.log("존재하지 않는 유저 입니다.")
              return;
            }
            socket.username = user.nickname;

            console.log("--- chat (" + RoomID + ")---\nlogged in : " + socket.username);

            //채팅방 찾기
            ChatLog.findById(RoomID, (err, found) => {
              if(err){
                console.log(err);
                return;
              }
              
              //채팅방 생성되 있을 때만 접속 가능
              if(found == null){
                //TODO 채팅방 생성 안되있는데 접근할때 대응하기
                console.log("존재하지 않는 채팅방 입니다.")
                return;
              }


              // console.log("기존 메시지 전송")
              //기존 채팅 데이터 전송
              for(let message of found.messages){
                let msgType = message.system ? 'system' : 'chat'
                let m = {
                  system: message.system,
                  username: message.username,
                  time: getTime(message.time),
                  message: message.message,
                }
                socket.emit(msgType, m);
              }
              
              //해당 채널에 입장
              socket.join(RoomID);
              console.log(io.sockets.adapter.rooms);

              let message = {
                system: true,
                message: socket.username + " 님이 채팅방 " + RoomID + " 에 입장 했습니다.",
              }
              // 해당 채널의 클라이언트에게 새로운 유저 입장 메시지 전송
              io.sockets.in(RoomID).emit("system", message);
              // DB 저장
              ChatLog.findById(RoomID, (err, found)=>{
                if(err){console.log(err); return;}
                found.messages.push(message);
                found.save();
              })
            })
          })
        }
      });

      // 클라이언트로부터의 메시지가 수신되면
      socket.on("chat", function (data) {
        console.log("Message from %s: %s", socket.username, data.message);

        // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
        io.sockets.in(RoomID).emit("chat", {
          username: socket.username,
          time: getTime(Date.now()),
          message: data.message,
        });

        // DB 저장
        ChatLog.findById(RoomID, (err, found)=>{
          if(err){console.log(err); return;}
          var newMessage = {
            from: data.userID,
            username: socket.username,
            message: data.message
          }
          found.messages.push(newMessage);
          found.save();
        })
        // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
        // socket.emit('s2c chat', msg);

        // 접속된 모든 클라이언트에게 메시지를 전송한다
        // io.emit('s2c chat', msg);

        // 특정 클라이언트에게만 메시지를 전송한다
        // io.to(id).emit('s2c chat', data);
      });

      // 클라이언트 퇴장시
      //TODO 클라이언트 측에서 새로고침 해야만 퇴장 처리됨
      socket.on("quit", function () {
        console.log("user disconnected: " + socket.username);
        let message = {
          system: true,
          message: socket.username + " 님이 퇴장 했습니다.",
        }
        io.emit("system", message);

        // DB 저장
        ChatLog.findById(RoomID, (err, found)=>{
          if(err){console.log(err); return;}
          found.messages.push(message);
          found.save();
        })
      });

      // force client disconnect from server
      socket.on("forceDisconnect", function () {
        socket.disconnect();
      });
    };

    return handler;
  },
};
