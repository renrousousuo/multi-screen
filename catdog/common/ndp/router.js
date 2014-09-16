var express = require('express');
var router = express.Router();
var log = require('loglevel');
log.setLevel('debug');

var _Router = {
    _rules : {}, //路由规则
    _appPath : '', //应用根目录
    _ctrlDir : '', //controller 路径
    /**
     * 加载配置文件
     */
    _setAppPath : function(dir){
        this._appPath = dir;
        this._ctrlDir = dir + "/controllers/";
    },
    
    /**
     * 执行 controller 方法
     */
    _exec : function(script, funcName, params){
        log.debug('[ndp]@router.js, load : ' + script + '; execute func: ' + funcName);
        var worker = require(script);
        var fn = worker[funcName];
        fn.apply(worker, params);
    },
    /**
     * 设置路由规则
     */
    _setRules : function(){
        var file = this._appPath + '/config/routes.json';
        var rules = require(file);
        this._rules = rules;
        for(var key in rules){
            var rule = rules[key];
            (function() {
                var ctrl = rule['controller'];
                var func = rule['function'] || 'execute';
                var ctrl_script = _Router._ctrlDir + ctrl;
                var method = rule['method'];
                log.debug('[ndp]@router.js, set rule : [' + method + '] ' + key + " => " + ctrl);
                if(method == 'get'){
                    router.get(key, function(req, res){
                        _Router._exec(ctrl_script, func, [req, res]);
                    });
                }
                else if(method == 'post'){
                    router.post(key, function(req, res){
                        _Router._exec(ctrl_script, func, [req, res]);
                    });
                }
                else{
                    log.warn('[ndp]@router.js, route rule err : ' + key);
                }
            
            })();
        }
        
    },
    /**
     * 处理一个 App 的路由规则
     */
    process : function(appPath){
        _Router._setAppPath(appPath);
        _Router._setRules();
    }
};

/* GET home page. */
router.get('/', function(req, res) {
  res.send('hi, this is a node server.');
});


module.exports = {
    'process' : _Router.process,
    'instance' : router
};