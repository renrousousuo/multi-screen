var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig =  require('swig');
var _ =  require('underscore');
var log = require('loglevel');
log.setLevel('debug');
var fs = require('fs');

/**
 */
var _ndp = {
    _port : 80, //端口
    _opts : {
        'static_perfix' : 'static',
    }, //配置信息
    _appPath : '', //app 路径
    instance : null //应用实例
};
_ndp._router = require("./router.js");

/**
 * 初始化 expess
 */
_ndp.initExpress = function(){
    var app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());
    
    app.use(require('./request.ext.js'));
    app.use(require('./response.ext.js'));
    
    //add socket io
    var server = require('http').Server(app);
    var io = require('socket.io')(server);
    
    // view engine setup
    var viewPath = path.join(_ndp._appPath, 'views');
    log.debug("[ndp]app path : " + _ndp._appPath + " ; view path : " + viewPath);
    // This is where all the magic happens!
    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', viewPath);
    // Swig will cache templates for you, but you can disable
    // that and use Express's caching instead, if you like:
    app.set('view cache', false);
    // To disable Swig's cache, do the following:
    swig.setDefaults({ cache: false });
    var swigFiltersScript = _ndp._appPath + '/filters.js';
    if(fs.existsSync(swigFiltersScript)){
        var swigFilters = require(swigFiltersScript);
        for(var key in swigFilters){
            swig.setFilter(key, swigFilters[key]);
        }
    }
    
    var prefix = this._opts['static_prefix'];
    app.use(prefix, express.static(path.join(_ndp._appPath, 'public')));
    //系统级别的路由分发
    app.use('/', _ndp._router.instance);
    
    /// catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    /// error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error.html', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error.html', {
            message: err.message,
            error: {}
        });
    });
    
    //启动 server
    server.listen(this._port);
    _ndp.instance = app;
    _ndp.io = io;
};

/**
 * 启动 ndp  
 * @param {String} 应用路径
 * @param {String} 端口
 * @param {String} 配置信息
 * 
 */
_ndp.start = function(appPath, port, options){
    _ndp._port = port;
    _ndp._appPath = appPath;
    _ndp._router.process(appPath);
    _.extend(this._opts, options);
    _ndp.initExpress();
};

module.exports = _ndp;