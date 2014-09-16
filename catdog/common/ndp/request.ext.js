/**
 * 扩展 reponse 对象
 */

module.exports = function(req, res, next){
    req._ext = {};
    
    /**
     * 一次返回多个参数
     */
    req._ext.pick = function(param_names){
        var ret = {};
        for(var i = 0, l = param_names.length; i < l; i++){
            var item = param_names[i];
            ret[item] = req.param(item);
        }
        return ret;
    };
    
    next();
};