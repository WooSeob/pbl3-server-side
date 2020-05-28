
function getTime(){
  let now = new Date()
  now.setTime(Date.now())

  let timeString = ''

  timeString = (now.getHours() < 12) ? '오전' : '오후'

  if(now.getHours() >= 13){
    timeString += (' ' + (now.getHours() - 12))
  }else{
    timeString += (' ' + now.getHours())
  }

  timeString += '.' + now.getMinutes() + '.' + now.getSeconds();
  return timeString
}

module.exports = {
    getHandler: function(_io){
        const io = _io;

        const handler = function(socket) {
            // 접속한 클라이언트의 정보가 수신되면
            socket.on('join', function(data){
                if (!socket.username){
                    console.log('Client logged-in:\n username: ' + data.username);
                    // socket에 클라이언트 정보를 저장한다
                    socket.username = data.username;
                    // 접속된 모든 클라이언트에게 메시지를 전송한다
                  
                    io.emit('system', {
                      system: true,
                      message: socket.username + " 님이 입장 했습니다."
                    });
                }
            });
          
            // 클라이언트로부터의 메시지가 수신되면
            socket.on('chat', function(data) {
                console.log('Message from %s: %s', socket.username, data.message);
            
                var msg = {
                  username: socket.username,
                  time: getTime(),
                  message: data.message
                };
            
                // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
                io.emit('chat', msg);
            
                // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
                // socket.emit('s2c chat', msg);
            
                // 접속된 모든 클라이언트에게 메시지를 전송한다
                // io.emit('s2c chat', msg);
            
                // 특정 클라이언트에게만 메시지를 전송한다
                // io.to(id).emit('s2c chat', data);
            });
          
            // 클라이언트 퇴장시
            socket.on('quit', function() {
                console.log('user disconnected: ' + socket.username);
                io.emit('system', {
                  system: true,
                  message: socket.username + " 님이 퇴장 했습니다."
                });
            });

            // force client disconnect from server
            socket.on('forceDisconnect', function() {
                socket.disconnect();
            })
        };

        return handler
    }
}
