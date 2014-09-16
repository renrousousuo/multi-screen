var ndp = require('../common/ndp/ndp.js');
var _ = require('underscore');

ndp.start(__dirname, '8084', {
    'static_prefix': '/static',
});
var __game = {};
Object.defineProperty(global, '__game', {
    enumerable: true,
    writable: false,
    value: __game
});
__game.conf = require('./config/app.json');

var io = ndp.io;

/**
 * 最大分组数
 */
var MAX_TEAM = 2;
/**
 * 最大玩家数
 */
var MAX_PLAYERS = 4;
/**
 * 符文类型数
 */
var MAX_SHAPE = 7;
/**
 * 图片最大生存周期
 */
var MAX_SHAPE_LIFE = 10 * 1000;

var MAX_HP = 3000;

/**
 * 符文基础属性
 */
var SHAPE_METADATA = {
    1: {
        damage: 100
    },
    2: {
        damage: 200
    },
    3: {
        damage: 150
    },
    4: {
        damage: 160
    },
    5: {
        damage: 180
    },
    6: {
        damage: 190
    },
    7: {
        damage: 250
    },
    8: {
        damage: 220
    },
    9: {
        damage: 170
    },
};

/**
 * 玩家角色名
 */
var ROLE_NAME = [
    "", "一鸣惊人", "二八佳人", "三生有幸", "四季发财",
    "五谷丰登", "六六大顺", "七上八下", "八面威风", "九五至尊"
];

/* ====== Begin Game Server ====== */
// 游戏展示端 socket 服务
var game_master = io.of('/master');
game_master.on('connection', function(socket) {
    //console.log(socket.handshake.headers);
    var client_ip = socket.request.connection.remoteAddress;
    var sid = socket.id;
    console.log('a master connected, socket id : %s , ip : %s', socket.id, client_ip);

    // 通知展示端连接成功
    socket.emit('sa-connected', {
        "errno": 0,
        "sid": sid,
        "status": 'done',
        "total": PLAYERS.total,
        "max_players": MAX_PLAYERS,
        "boss_list": BOSS_LSIT
    });

    // 开始游戏时，开始生成符文
    socket.on("as_start_game", function(msg) {
        console.log("======= STRAT GAME ========");
        BOSS_LSIT = __BOSS_LSIT; //初始化boss
        GAME_CTRL.genShape(); //生成符文
    });

    // 停止产生符文
    socket.on("as_stop_gen_shape", function(msg) {
        console.log("======= GMAE MASTER STOP GEN SHAPE ========");
        console.log("cur shape: %j", SHAPE_LIST);
        GAME_CTRL.stopGenShape();
    });

    // 终止游戏
    socket.on("as_end_game", function(msg) {
        console.log("======= GMAE MASTER STOP GAME ========");
        GAME_CTRL.endGame('-1');
    });

    socket.on('disconnect', function() {
        console.log('disconnect...');
    });
});

// 游戏操作端
var game_slave = io.of('/slave');
game_slave.on('connection', function(socket) {
    console.log('a player connected, socket.id: %j', socket.id);
    if (PLAYERS.total >= MAX_PLAYERS) {
        socket.emit("sm-enter-game-failed", {
            "action": "sm-enter-game-failed",
            "msg": "玩家已满",
        });
        console.log('game_slave : player full...');
    } else {
        GAME_CTRL.addPlayer(socket);
    }

    socket.on("ms-attack", function(msg) {
        var shape = msg.data.shape_type; // 符文 id
        var player = PLAYERS.members[socket.id]; //当前玩家
        var attack_result = GAME_CTRL.removeShape(player, shape); // 删除符文
        var ret_msg = {
            "action": "sm-attack",
            "data": attack_result
        };
        socket.emit(ret_msg.action, ret_msg); //通知玩家
    });

    socket.on('disconnect', function() { // 用户离开
        GAME_CTRL.removePlayer(socket);
        console.log('game_slave::socket, disconnect... socket.id: %j',
            socket.id);
    });
});

io.on('connection', function(socket) {
    //console.log('a user connected, socket id :' + socket.id);
    //console.log(io.client);
    var id = socket.id;
});

/* ====== End Game Server ====== */

// 游戏控制中心
var GAME_CTRL = {};


var PLAYERS = { // 玩家数据
    player_team_map: {}, // 玩家与所属组的 hash map
    total: 0,
    members: {
        //'id': {}
    }
};

// boss 列表，team 编号对应 boss 编号，1 组 => BOSS_LSIT[1];
var BOSS_LSIT = [{}, {
    "max_hp": MAX_HP,
    "hp": MAX_HP,
    "name": "飞天猫",
}, {
    "max_hp": MAX_HP,
    "hp": MAX_HP,
    "name": "哮天犬",
}, {
    "max_hp": MAX_HP,
    "hp": MAX_HP,
    "name": "九尾狐",
}];

var __BOSS_LSIT = BOSS_LSIT; //boss 初始列表

// 符文列表
var SHAPE_LIST = [];


var player_seats = {}; // 位置占位

//停止游戏
GAME_CTRL.endGame = function(loser) {
    console.log("==== game over ====");
    GAME_CTRL.stopGenShape(); //停止产生符文
    //通知展示端，
    game_master.emit('sa-gameover', {
        "action": "sa-gameover",
        "data": {
            "loser": loser //失败者
        }
    });
    game_slave.emit('sm-gameover', {
        "action": "sm-gameover",
        "data": {
            "loser": loser //失败者
        }
    });
};

// 新增玩家
GAME_CTRL.addPlayer = function(socket) {
    // 构造玩家
    var cur_player_no = 0;
    for (var i = 0; i <= MAX_PLAYERS; i++) {
        if (!player_seats[cur_player_no]) { // 这个位置没有人占
            player_seats[cur_player_no] = true;
            break;
        }
        cur_player_no++;
    }

    PLAYERS.total + 1;

    PLAYERS.total++;
    var player = {
        "player_no": cur_player_no, // 队员编号
        "userid": socket.id, //用户 id
        "name": ROLE_NAME[cur_player_no], // 名称
        "team": -1, // 所属组
        "hero": -1, // 本方英雄
        "enemy": -1, // 敌方
    };
    PLAYERS.members[socket.id] = player; // 追加至玩家列表

    //分组
    player.team = cur_player_no % MAX_TEAM + 1; // 强制取模
    player.hero = player.team; // 组编号为本方英雄编号
    var team_enemy_map = { // 组和敌对英雄的关系
        "1": 2,
        "2": 1,
    };
    player.enemy = team_enemy_map[player.team];

    var hero = BOSS_LSIT[player.hero];
    //通知玩家
    socket.emit("sm-welcome", {
        "action": "sm-welcome",
        "data": {
            "user": player,
            "hero": hero,
            "total": PLAYERS.total
        }
    });

    // 通知展示端
    var __msg = {
        "action": "sa-user-join",
        "data": player
    };
    console.log("GAME_CTRL.addPlayer : %j", player);
    game_master.emit(__msg.action, {
        "action": __msg.action,
        "data": {
            "total": PLAYERS.total,
            "player_no": player.player_no,
            "userid": player.userid,
            "name": player.name,
            "team": player.team
        }
    });
};

/**
 * 移除玩家
 * @param {Socket} socket
 */
GAME_CTRL.removePlayer = function(socket) {
    /* TODO : 移除用户 */
    var player = PLAYERS.members[socket.id];
    if (!player) {
        return;
    }
    delete PLAYERS.members[socket.id];

    player_seats[player.player_no] = null; // 释放占位

    PLAYERS.total = Math.max(0, PLAYERS.total - 1);
    //通知展示端
    var __msg = {
        "action": "sa-user-leave",
        "data": player
    };
    console.log("GAME_CTRL.removePlayer() __msg: %j", __msg);
    game_master.emit(__msg.action, {
        "action": __msg.action,
        "data": {
            "total": PLAYERS.total,
            "player_no": player.player_no,
            "userid": player.userid,
            "name": player.name,
            "team": player.team
        }
    });
}

// 生成符文
var timer;
GAME_CTRL.genShape = function() {
    if (timer) { // 收回计时器
        clearInterval(timer);
    }
    timer = setInterval(function() {
        // 移除过期的形状
        var now = new Date;
        SHAPE_LIST = SHAPE_LIST.filter(function(item) {
            if (now - item.birthday >= MAX_SHAPE_LIFE) {
                game_master.emit('sa-rm-shape', {
                    "action": "sa-rm-shape",
                    "data": {
                        'shape': item,
                        'is_by_attack': false,
                    }
                });
                // console.log('GAME_CTRL.genShape() remove shape : %j', item);
                return false; // remove
            }
            return true;
        });

        var shape_type = parseInt(Math.random() * MAX_SHAPE); // 生成符文
        var shapeid = require('shortid').generate(); // 用户 id
        var shape = {
            'type': shape_type, // 符文类别
            'id': shapeid, // 符文id
            "birthday": +now // 构建时间
        };
        SHAPE_LIST.push(shape); // 添加至符文比例
        console.log("GAME_CTRL.genShape, a new shape : %j", shape);
        console.log("GAME_CTRL.genShape, cur_shapes : %j", SHAPE_LIST);
        game_master.emit('sa-new-shape', {
            "action": "sa-new-shape",
            "data": {
                'shape': shape,
                'prop': SHAPE_METADATA[shape_type],
            }
        });
    }, 2000);
};

//停止产生符文
GAME_CTRL.stopGenShape = function() {
    if (timer) { // 收回计时器
        clearInterval(timer);
    }
    game_master.emit('sm-stop-gen-shape', {
        "action": "sm-stop-gen-shape",
        "data": {
            'shapes': SHAPE_LIST
        }
    });
};

// 删除符文
GAME_CTRL.removeShape = function(player, shape_type) {
    //从符文里边删除第一个符合 id 的符文
    var list = [];
    var cur_shapes = SHAPE_LIST;
    console.log("---- rm shapes start ----");
    //console.log("removeShape() cur_shapes : %j", cur_shapes);
    var is_found = false;
    var removed = null;
    for (var i = 0, l = cur_shapes.length; i < l; i++) {
        var shape = cur_shapes[i];
        if (shape['type'] === parseInt(shape_type)) {
            if (is_found) {
                list.push(shape);
            } else {
                is_found = true;
                removed = shape;
            }
        } else {
            list.push(shape);
        }
    }

    SHAPE_LIST = list;

    var attack_result = null;
    var is_by_attack = false;
    if (removed) { //符文删除成功
        is_by_attack = true;
        attack_result = GAME_CTRL.attack(player, shape_type);
    }

    console.log("remove shape : %s; remain : %j",
        shape_type, SHAPE_LIST);
    console.log("attack result : %j", attack_result);
    console.log("---- rm shapes done ----");

    // 通知展示端

    /* TODO : 发送攻击，team、hp */
    var __msg = {
        "action": "sa-rm-shape",
        "data": {
            'shape': removed,
            'is_by_attack': is_by_attack,
            'attack_result': attack_result,
            //'prop': SHAPE_METADATA[i],

            //"shape_list": SHAPE_LIST,
        }
    };

    game_master.emit('sa-rm-shape', __msg);
    return attack_result;
};

// 攻击 boss
GAME_CTRL.attack = function(player, shape) {
    if (!player) {
        console.log('GAME_CTRL.attack() player is empty.');
        return false;
    }
    var shapeMetaData = SHAPE_METADATA[shape];

    if (!shapeMetaData) {
        console.log('GAME_CTRL.attack() shapeMetaData is empty.');
        return false;
    }
    console.log('GAME_CTRL.attack() player: %j', player);
    var boss = BOSS_LSIT[player.enemy]; //boss
    if (!boss) {
        console.log('GAME_CTRL.attack() boss is empty.');
        return;
    }
    var damage = shapeMetaData['damage'];
    var hp = Math.max(0, boss.hp - damage); // 剩余血量
    boss['hp'] = hp; // 更新血量
    var boss_status = {
        "name": boss["name"], // 名称
        "hp": -1, // 血值改变
        "damage": -1, // 攻击力
        //"score": 11, // 积分
    };

    boss_status.hp = hp; // 当前血量
    boss_status.damage = damage; // 伤害值
    var ret = {
        "player": player,
        "boss_status": boss_status
    };
    //boss血量为 0，游戏结束
    if (parseInt(boss.hp) <= 0) {
        GAME_CTRL.endGame(boss_status.name);
    } else {
        console.log("==== game go on ====");
    }
    return ret;
};