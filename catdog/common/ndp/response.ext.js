/**
 * 扩展 reponse 对象
 */

module.exports = function(req, res, next){
    res._ext = {};
    
    /**
     * 规范 json 返回值格式
     */
    res._ext.json_error = function(err, msg, data){
        var ret = {
            'error' : 0,
            'data'  : data,
            'msg'   : msg
        };
        res.json(ret);
    };
    
    /**
     * 规范 json 返回值格式
     */
    res._ext.json_success = function(data, msg){
        var ret = {
            'error' : 0,
            'data'  : data,
            'msg'   : msg
        };
        res.json(ret);
    };
    next();
};