var ndp = require('../common/ndp/ndp.js');
var _ = require('underscore');

ndp.start(__dirname, '8084', {
    'static_prefix': '/static',
});


// __game 全局对象
var __game = {};
Object.defineProperty(global, '__game', {
    enumerable: true,
    writable: false,
    value: __game
});

// 读取游戏配置
var GAME_CONF = require('./config/game.json');



/**
 * 最大分组数
 */
var MAX_TEAM = 2;
/**
 * 最大玩家数
 */
var MAX_PLAYERS = GAME_CONF.max_players_in_room;
/**
 * 符文类型数
 */
var MAX_SHAPE = 7;
/**
 * 图片最大生存周期
 */
var MAX_SHAPE_LIFE = 10 * 1000;

/* ====== Begin Game Server ====== */
/**
 * 初始化游戏控制端 socket server
 * @return {object} socket.io 的 namespace 实例
 */
function _initGameMaster() {
    // socket io 实例
    var io = ndp.io;

    // 游戏展示端 socket 服务
    var game_master = io.of('/master');
    game_master.on('connection', function(socket) {
        //console.log(socket.handshake.headers);
        var client_ip = socket.request.connection.remoteAddress;
        var sid = socket.id;
        console.log('a master connected, socket id : %s , ip : %s', socket.id, client_ip);

        // 通知展示端连接成功
        var data = GAME_INSTANCE.getGameData();
        socket.emit('sa-connected', {
            "errno": 0,
            "sid": sid,
            "status": 'done',
            "total": data['players']['total'],
            "max_players": MAX_PLAYERS,
            "boss_list": data['boss_list']
        });

        // 开始游戏时，开始生成符文
        socket.on("as_start_game", function(msg) {
            console.log("======= STRAT GAME ========");
            GAME_INSTANCE.reset();
            GAME_INSTANCE.genShape();
        });

        // 停止产生符文
        socket.on("as_stop_gen_shape", function(msg) {
            console.log("======= GMAE MASTER STOP GEN SHAPE ========");
            GAME_INSTANCE.stopGenShape();
        });

        // 终止游戏
        socket.on("as_end_game", function(msg) {
            console.log("======= GMAE MASTER END GAME ========");
            GAME_INSTANCE.endGame(null);
        });

        socket.on('disconnect', function() {
            console.log('a master disconnect...');
        });
    });
    return game_master;
}

/**
 * 初始化游戏玩家端 socket server
 * @return {object} socket.io 的 namespace 实例
 */
function _initGmaeSlave() {
    // 游戏操作端
    var game_slave = ndp.io.of('/slave');
    game_slave.on('connection', function(socket) {
        console.log('a player connected, socket.id: %j', socket.id);

        GAME_INSTANCE.addPlayer(socket);

        socket.on("ms-attack", function(msg) {
            var shape = msg.data.shape_type; // 符文 id
            var sid = socket.id;

            // 删除符文
            var attack_result = GAME_INSTANCE.removeShape(sid, shape);

            // 通知玩家攻击效果
            var ret_msg = {
                "action": "sm-attack",
                "data": attack_result
            };
            socket.emit(ret_msg.action, ret_msg);

            // 判断游戏是否结束
            if (attack_result && attack_result["boss_status"]) {
                var boss_status = attack_result["boss_status"];
                var hp = boss_status["hp"];
                // boss血量为 0，游戏结束
                if (parseInt(hp) <= 0) {
                    GAME_INSTANCE.endGame(boss_status);
                }
            }

        });

        // 获取可用符文列表，调试使用
        socket.on("ms-get-shape-list", function(msg) {
            var types = _.pluck(GAME_INSTANCE._shape_list, 'type');
            var ret_msg = {
                "action": "sm-shape-list",
                "data": types
            };
            socket.emit(ret_msg.action, ret_msg);
        });

        socket.on('disconnect', function() { // 用户离开
            GAME_INSTANCE.removePlayer(socket);
            console.log('game_slave::socket, disconnect... socket.id: %j',
                socket.id);
        });
    });
    return game_slave;
}

/**
 * 游戏 Server 实例
 */
var GAME_SERVER = {
    'io': ndp.io,
    'master': _initGameMaster(),
    'slave': _initGmaeSlave(),
    'sockets': {}, // socket 实例列表
};

GAME_SERVER.io.on('connection', function(socket) {
    //console.log('a user connected, socket id :' + socket.id);
    //console.log(io.client);
    var sid = socket.id;
    GAME_SERVER.sockets[sid] = socket;
});
/* ====== End Game Server ====== */


/* ====== Start Game Controller ====== */
var Game = function() {
    // 符文列表
    this._shape_list = [];
    // 初始化 boss
    this._boss_list = [];
    this._players = { // 玩家数据
        player_team_map: {}, // 玩家与所属组的 hash map
        total: 0,
        members: {
            //'id': {}
        },
        //玩家位置占位
        seats: {}
    };
};

Game.prototype._initBoss = function() {
    // boss 列表，team 编号对应 boss 编号，1 组 的英雄为 1号boss;
    var boss_list = [{}];
    var meta = GAME_CONF.boss_metadata;

    for (var i = 1, l = meta.length; i < l; i++) {
        var boss = {
            'max_hp': meta[i]['max_hp'],
            'name': meta[i]['name'],
            'hp': meta[i]['max_hp']
        };
        boss_list.push(boss);
    }
    return boss_list;
};

Game.prototype.getGameData = function() {
    var d = {
        players: this._players,
        boss_list: this._boss_list
    };
    return d;
};

/**
 * 开始游戏
 */
Game.prototype.reset = function() {
    this._shape_generate_timer = null;
    this._boss_list = this._initBoss();
    this._shape_list = [];
};

/**
 * 生成符文
 */
Game.prototype.genShape = function() {
    var timer = this._shape_generate_timer;
    if (timer) { // 收回计时器
        clearInterval(timer);
    }
    var self = this;
    this._shape_generate_timer = setInterval(function() {
        // 移除过期的形状
        var now = new Date;
        self._shape_list = self._shape_list.filter(function(item) {
            if (now - item.birthday >= MAX_SHAPE_LIFE) {
                console.log("Game.genShape :[outdated] %j", item.type);
                GAME_SERVER.master.emit('sa-rm-shape', {
                    "action": "sa-rm-shape",
                    "data": {
                        'shape': item,
                        'is_by_attack': false,
                    }
                });
                return false; // remove
            }
            return true;
        });

        // 生成符文，从 1 开始
        var shape_type = parseInt(Math.random() * MAX_SHAPE) + 1;
        var shapeid = require('shortid').generate(); // 用户 id
        var shape = {
            'type': shape_type, // 符文类别
            'id': shapeid, // 符文id
            "birthday": +now // 构建时间
        };
        self._shape_list.push(shape); // 添加至符文列表
        console.log("Game.genShape :[new]      %j", shape.type);
        GAME_SERVER.master.emit('sa-new-shape', {
            "action": "sa-new-shape",
            "data": {
                'shape': shape,
                'prop': GAME_CONF['shape_metadata'][shape_type],
            }
        });
    }, 2000);
};

//停止产生符文
Game.prototype.stopGenShape = function() {
    var timer = this._shape_generate_timer;
    if (timer) { // 收回计时器
        clearInterval(timer);
    }
    var shapes = _.pluck(this._shape_list, 'type');
    GAME_SERVER.master.emit('sa-stop-gen-shape', {
        "action": "sa-stop-gen-shape",
        "data": {
            'shapes': shapes
        }
    });
};

//停止游戏
Game.prototype.endGame = function(loser) {
    console.log("==== game over ====");
    this.stopGenShape(); //停止产生符文
    //通知展示端，
    GAME_SERVER.master.emit('sa-gameover', {
        "action": "sa-gameover",
        "data": {
            "loser": loser //失败者
        }
    });
    GAME_SERVER.slave.emit('sm-gameover', {
        "action": "sm-gameover",
        "data": {
            "loser": loser //失败者
        }
    });
};

// 新增玩家
Game.prototype.addPlayer = function(socket) {
    var ret = {
        'player': null
    };
    var players = this._players;
    // 判断玩家是否已满
    var msg = '';
    if (this._players.total >= MAX_PLAYERS) {
        msg = "玩家已满，请稍后重试";
        socket.emit("sm-enter-game-failed", {
            "action": "sm-enter-game-failed",
            "data": {
                "msg": "玩家已满，请稍后重试"
            }
        });
        console.log('Game.addPlayer : create player failed... msg : ' + msg);
        return ret;
    }

    // 构造玩家，编号从 1 开始

    var cur_player_no = 1;

    for (var i = 0; i <= MAX_PLAYERS; i++) {
        if (!players['seats'][cur_player_no]) { // 这个位置没有人占
            players['seats'][cur_player_no] = true;
            break;
        }
        cur_player_no++;
    }

    var role_name = GAME_CONF['role_name'][cur_player_no];
    var player = {
        "player_no": cur_player_no, // 队员编号
        "userid": socket.id, //用户 id
        "name": role_name, // 名称
        "team": -1, // 所属组
        "hero": -1, // 本方英雄
        "enemy": -1, // 敌方
    };
    players.members[socket.id] = player; // 追加至玩家列表

    //分组
    player.team = cur_player_no % MAX_TEAM + 1; // 强制取模
    player.hero = player.team; // 组编号为本方英雄编号
    var team_enemy_map = { // 组和敌对英雄的关系
        "1": 2,
        "2": 1,
    };
    player.enemy = team_enemy_map[player.team];
    players.total++;
    console.log("Game.addPlayer : %j", player);


    //通知玩家
    var hero = this._boss_list[player.hero];
    socket.emit("sm-welcome", {
        "action": "sm-welcome",
        "data": {
            "user": player,
            "hero": hero,
            "total": players.total
        }
    });

    // 通知展示端
    var __msg = {
        "action": "sa-user-join",
        "data": {
            "total": players.total,
            "player_no": player.player_no,
            "userid": player.userid,
            "name": player.name,
            "team": player.team
        }
    };
    GAME_SERVER.master.emit(__msg.action, __msg);
};

/**
 * 移除玩家
 * @param {Socket} socket
 */
Game.prototype.removePlayer = function(socket) {

    var player = this._players.members[socket.id];
    if (!player) {
        return;
    }
    delete this._players.members[socket.id];

    this._players['seats'][player.player_no] = null; // 释放占位

    this._players.total = Math.max(0, this._players.total - 1);

    console.log("Game.removePlayer : %j", player);

    //通知展示端
    var __msg = {
        "action": "sa-user-leave",
        "data": {
            "total": this._players.total,
            "player_no": player.player_no,
            "userid": player.userid,
            "name": player.name,
            "team": player.team
        }
    };
    GAME_SERVER.master.emit(__msg.action, __msg);
}

// 删除符文
Game.prototype.removeShape = function(sid, shape_type) {
    console.log("---- Game.removeShape : start ----");
    var player = this._players.members[sid];
    console.log('Game.removeShape() player : %j', player);

    //从符文里边删除第一个符合 id 的符文
    var list = [];
    var cur_shapes = this._shape_list;
    console.log('Game.removeShape() current shapes : %j , to rm : %s', _.pluck(cur_shapes, 'type'), shape_type);
    var shape_to_remove = parseInt(shape_type);
    var is_found = false;
    var removed = null;
    for (var i = 0, l = cur_shapes.length; i < l; i++) {
        var shape = cur_shapes[i];
        if (shape['type'] === shape_to_remove) {
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
    this._shape_list = list;

    var attack_result = null;
    var is_by_attack = false;
    if (removed) { //符文删除成功
        is_by_attack = true;
        attack_result = this.attack(player, shape_type);
    }

    console.log('Game.removeShape() , remain shapes : %j', _.pluck(this._shape_list, 'type'));
    console.log("---- Game.removeShape : done ----");

    // 通知展示端
    var __msg = {
        "action": "sa-rm-shape",
        "data": {
            'shape': removed,
            'is_by_attack': is_by_attack,
            'attack_result': attack_result,
        }
    };
    GAME_SERVER.master.emit('sa-rm-shape', __msg);

    return attack_result;
};

// 执行攻击 boss
Game.prototype.attack = function(player, shape) {

    if (!player) {
        console.log('Game.attack() player is empty.');
        return false;
    }
    var shape_meta = GAME_CONF['shape_metadata'][shape];
    if (!shape_meta) {
        console.log('Game.attack() shape metadata is empty');
        return false;
    }
    var damage = shape_meta['damage'];

    var boss = this._boss_list[player.enemy]; //boss
    if (!boss) {
        console.log('Game.attack() boss is empty.');
        return false;
    }

    var hp = Math.max(0, boss.hp - damage); // 剩余血量
    boss['hp'] = hp; // 更新血量
    var boss_status = {
        "name": boss["name"], // 名称
        "hp": -1, // 当前血量
        "damage": -1, // 伤害值
    };

    boss_status.hp = hp; // 当前血量
    boss_status.damage = damage; // 伤害值
    var ret = {
        "player": player,
        "boss_status": boss_status
    };

    console.log("Game.attack() attack result : %j", boss_status);
    return ret;
};

/**
 * 游戏实例
 */
var GAME_INSTANCE = new Game();
GAME_INSTANCE.reset();