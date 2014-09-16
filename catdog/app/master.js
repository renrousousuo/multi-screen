var ndp = require('../common/ndp/ndp.js');

ndp.start(__dirname, '8084', {
    'static_prefix' : '/static',
});
var __game = {};
Object.defineProperty(global, '__game', {
    enumerable: true,
    writable: false,
    value: __game
});
__game.conf = require('./config/app.json');

var io = ndp.io;


var name_list = []

//游戏展示端
var game_master = io.of('/master');
game_master.on('connection', function (socket) {
    var id = socket.id;
    socket.emit('connect_status', {
        "id": id,
        "status": 'done',
        "errno": 0
    });
});

var players = {
    total: 0,
    members: {
        //'id': {}
    }
};

var ROLE_NAME = [
    "", "一鸣惊人", "二八佳人", "三生有幸", "四季发财",
    "五谷丰登", "六六大顺", "七上八下", "八面威风", "九五至尊"
]; //玩家角色名

var BOSS_LSIT = [
    {
        "name" : "飞天猫",
    },
    {
        "name" : "哮天犬",
    }
]; //boss 列表


//游戏客户端
var game_slave = io.of('/slave');
game_slave.on('connection', function (socket) {
    var id = socket.id;
    var cur_player_no = players.total + 1;
    players.total++;
    var shortId = require('shortid');
    var msg = {
      "sid": id,
      "action": "sm-welcome",
      "data": {
        "player_no": cur_player_no, //队员编号
        "userid": shortId.generate(), //用户 id
        "name": ROLE_NAME[cur_player_no],//名称
      }
    };
    socket.emit(msg.action, msg);
});


io.on('connection', function(socket){
    console.log('a user connected, socket id :' + socket.id);
    //console.log(io.client);
    var id = socket.id;
    /*socket.emit('connect_status', {
        "id": id,
        "status": 'done',
        "errno": 0
    });*/
    socket.on('chat_message', function(data){
        console.log('chat_message : ' + data);
        socket.emit('chat_msg_send', data);
    });

    socket.on('disconnect', function(){
        console.log('disconnect...');
    });
});