# 画符 API 文档

标签： API 文档

---
## 字典

简称|含义|备注
---|----|---
M  |Mobile|移动端
P  |PC    |PC端
S  |Server|服务端
A  |All   |其他所有方

## 通信协议

### 移动端进入游戏 - 暂不实现

```
{
  "action": "ms-enter",
  "data": {
    "channel": 1, // 进入频道号
    "username": "齐天大圣" // 用户名
  }
}
```

### 加入成功通知

```
{
  "action": "sm-welcome",
  "data": {
    'user' : {
      "player_no": 1, //玩家编号
      "userid": '121212', //用户 id
      "name": '一鸣惊人',//名称
      "team": 1, //所属组
      "hero": 1, //本方英雄编号
      "enemy": 2, //敌方英雄编号
    },
    'hero': {//本方英雄
      "hp": "10000", //血量
      "name" : "飞天猫", //名称
    }
}
```

### 移动端加入游戏失败

```
{
  "action": "sm-enter-game-failed",
  "data": {
    "msg": '人数爆满', // 进入频道号
  }
}
```

### PC页面需要处理的消息

#### 成功建立连接

```
{
  "action": "sa-connected",
  "data": {
    "sid": "socket id"
  }
}
```

#### 加入一名玩家

```
{
  "action": "sa-user-join",
  "data": {
    "player_no": 1, //玩家编号
    "userid": '121212', //用户 id
    "name": '一鸣惊人',//名称
    "team": 1, //所属组
  }
}
```

#### 产生一个符文

```
{
  "action": "sa-new-shape",
  "data": {
      'shape': {
          type: shape_type, //符文类别
          id: shapeid,//符文id
      },
      'prop': { //符文属性
        damage: 150 //伤害值
      }, 
  }
}
```

#### 消耗一个符文

```
{
  "action": "sa-rm-shape",
  "data": {
      'is_by_attack':false, //是否攻击产生
      'shape': {
        'type': 1, //符文编号
        'id': 'qwqw', //符文id
      },
      'attack_result' {
        "player": { //攻击者
          "userid": '121212', //用户 id
          "name": '一鸣惊人',//名称
          "team": 1, //所属组
        }, 
        "boss_status": { //被攻击的 boss 的当前信息
          "name": "名称", //被攻击的 boss id 
          "hp": 9000 // 受到伤害后的血值
          "damage": 12 // 收到的伤害
        }
      }
  }
}
```

#### BOSS 受到伤害

```
{
  "action": "sa-attack",
  "data": {
    "attacker": { //攻击者
      "userid": '121212', //用户 id
      "name": '一鸣惊人',//名称
      "team": 1, //所属组
    }, 
    "boss_info": { //被攻击的 boss 的当前信息
      "boss_id":1, //被攻击的 boss id 
      "hp": 9000 // 受到伤害后的血值
      "score": 11 // 积分，保留字段
      "userid": 1, // 用户id
      "shapeid": 1, // 形状id
      "damage": 12 // 收到的伤害
    }
  }
}
```


### 状态通知

```
{
  "action": "sa-status-change",
  "data": {
    "status": "waiting", // waiting, playing, gameover
    "total": 4, // 游戏人数
    "count": 2, // 当然人数
    "hp": [99, 100], // 血值
    "team": { // status 为 playing, gameover 时有效
        "left": [{ // 左方
            "userid": 1, // 用户id
            "username": "player1", // 用户名
            "score": 12 // 输出积分
        }, {
            "userid": 2,
            "username": "player2",
            "score": 11
        }],
        "right": [{ // 右方
            "userid": 3,
            "username": "player4",
            "score": 10
        }, {
            "userid": 4,
            "username": "player4",
            "score": 0
        }]
    },
    "winner": "left" // 获胜方
  }
}
```

### 画符（发送攻击）

```
{
  "action": "ms-attack",
  "data": {
    "channel": 1, // 进入频道号
    "shape_type": 1, // 形状类型
    "userid": 1 // 用户id
  }
}
```

### 画符通知

```
{
  "action": "sp-attack",
  "data": {
    "team": "left", // 来源
    "hp": [99, 23] // 血值改变
    "score": 11 // 积分
    "userid": 1, // 用户id
    "shapeid": 1, // 形状id
    "damage": 12 // 攻击力
  }
}
```

### 消息通知

```
{
    "action": "sm-message",
    "data": {
        "type": "error", // error: 错误, talk: 对话, notice: 通知
        "userid": 0, // 来源id
        "username": 0, // 来源用户名
        "msg": "该场地人数已满，请换一个场地"
    }
}
```

### 添加备用符

```
{
  "action": "sp-add-shape",
  "data": {
    "shapeid": 1, // 形状id
    "lefttime": // 生命周期，单位毫秒
  }
}
```

### 移除备用符

```
{
  "action": "sp-remove-shape",
  "data": {
    "shapeid": 1, // 形状id
    "status": "attack" // "attack"：被使用，"wither"：自然枯萎
  }
}
```
