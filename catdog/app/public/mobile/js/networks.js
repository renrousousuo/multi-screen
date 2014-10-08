var networks = networks || {};

void

function(exports) {
  var serverUrl = 'http://172.22.74.162:8084/slave';
  //var serverUrl = 'http://192.168.1.129:8084/slave';

  var socket;
  var connected;
  var user = {
    userid: -1
  };

  function connect(callback) {
    callback = callback || function() {};
    socket = io(serverUrl);
    socket.on('connect', function() {
      socket.emit('ms-enter', 'hello');
      console.log('connect success.');
      connected = true;
      callback("connect");
    });

    socket.on('failed', function() {
      callback("failed");
    });
    socket.on('sm-welcome', function(msg) {
      user = msg.data.user;
      callback("welcome", msg.data);
    });
    socket.on('sm-attack', function(msg) {
      callback("attack", msg.data);
    });
  }

  function attack(shapeType, path) {
    if (!connected) {
      console.log('error');
      return;
    }
    console.log('attack %s', shapeType);
    var msg = {
      "action": "ms-attack",
      "data": {
        "channel": 1, // 进入频道号
        "shape_type": shapeType, // 形状id
        "userid": user.userid, // 用户id
        "path": path // 路径，测试用
      }
    };
    socket.emit(msg.action, msg);
  }

  exports.connect = connect;
  exports.attack = attack;

}(networks);