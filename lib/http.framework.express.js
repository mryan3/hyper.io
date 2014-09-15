'use strict';

var _              = require('lodash');
var when           = require('when');
var express        = require('express');
var compress       = require('compression');     // aka. express.compress
var cookieParser   = require('cookie-parser');   // aka. express.cookieParser
var errorHandler   = require('errorhandler');    // aka. express.errorHandler
var bodyParser     = require('body-parser');     // aka. express.bodyParser
var methodOverride = require('method-override'); // aka. express.methodOverride
var morgan         = require('morgan');          // aka. express.logger
//
var Util           = require('./util.js');
var logger         = null;

module.exports = HttpFramework_Express;

function HttpFramework_Express(options, $stats){
    this._options = _.merge({
        env: 'dev',
        port: 8000,
        compress: true,
        urlencoded: true,
        parser: {
            cookies: true,
            body:    true,
            json:    true
        },
        session: false
    }, options);

    this._stats  = $stats;

    logger = Util.getLogger('HttpFramework_Express');

    this._app = express();
    this._server = null;
}

// load all services
HttpFramework_Express.prototype.load = function() {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------
    this._app.set('port', process.env.PORT || this._options.port);

    this._app.use(this._getExpressLogger());

    this._app.use(methodOverride());

    if(this._options.env === 'dev') {
        this._app.use(errorHandler({showStack: true, dumpExceptions: true}));
    }
    if(this._options.compress) {
        this._app.use(compress());
    }
    if(this._options.urlencoded) {
        this._app.use(bodyParser.urlencoded());
    }
    if(this._options.parser.cookies) {
        this._app.use(cookieParser());
    }
    if(this._options.parser.body) {
        this._app.use(bodyParser());
    }
    if(this._options.parser.json) {
        this._app.use(bodyParser.json());
    }

    if(this._options.session) {
        // if this._options.session no object then make default settings
        if(!_.isObject(this._options.session)) {
            this._options.session = {
                secret: "keyboard kitty",
                    cookie: {
                    path: '/',
                        httpOnly : false,
                        maxAge: 1000 * 60 * 24 // 24 hours
                },
                storeInst: new express.session.MemoryStore()
            };
        }

        this._app.use(express.session({
            secret: this._options.session.secret,
            cookie: this._options.session.cookie,
            store:  this._options.session.storeInst
        }));
    }

    resolve();

// ------------------------------------------------
}.bind(this));
// end promise wrapper
};

HttpFramework_Express.prototype.start = function() {
    this._server = this._app.listen(this._app.get('port'), function () {
        logger.log('Listening on port %d', this._server.address().port);
    }.bind(this));
};

HttpFramework_Express.prototype.validateMethod = function(method) {
    if( !this._app[ method ] ||
        !_.isFunction(this._app[ method ])) {
        logger.warn("ServiceManager: Invalid method", method);
        return false;
    } else {
        return true;
    }
};

HttpFramework_Express.prototype.addMethodFunction = function(method, plugins, routeStr, func) {

    var validPlugins = [];
    if(plugins) {
        for(var i = 0; i < plugins.length; i++) {
            // if plugin has isType, is express and has setupRoute function
            // filter out all invalid plugins
            if (plugins[i] &&
                plugins[i].plugin &&
                _.isFunction(plugins[i].plugin.isType) &&
                plugins[i].plugin.isType('express') &&
                _.isFunction(plugins[i].plugin.setupRoute)) {

                validPlugins.push( plugins[i] );
            }
        }
    }

    if( validPlugins &&
        _.isArray(validPlugins) &&
        validPlugins.length ) {

        // run setupRoute for each plugin
        _.forEach(validPlugins, function (validPlugin) {
            validPlugin.plugin.setupRoute(this._app, method, routeStr, func, validPlugin.options);
        }.bind(this));

    }

    this._app[ method ](routeStr, func);
};

HttpFramework_Express.prototype.addStaticDir = function(staticDir) {
    return this._app.use(express.static(staticDir));
};

HttpFramework_Express.prototype.addStaticFile = function(staticRoute, staticFile) {
    this._app.get(staticRoute, function(req, res){
        res.sendfile( staticFile );
    }.bind(this));
};

HttpFramework_Express.prototype.addStaticFileDefault = function(staticFile) {
    this._app.use(function(req, res){
        // TODO: fix error
        res.sendfile( staticFile );
    }.bind(this));
};

HttpFramework_Express.prototype.addRedirect = function(from, to) {
    return this._app.use(from, function(req, res) {
        res.redirect(to);
    }.bind(this));
};

// custom logging function to add 'x-forwarded-for' and defaults for missing values
HttpFramework_Express.prototype._getExpressLogger = function(){
    morgan.token('remote-addy', function(req, res){
        if( req.headers.hasOwnProperty('x-forwarded-for') ){
            return req.headers['x-forwarded-for'];
        } else {
            return req.connection.remoteAddress;
        }
    });

    /*
     var logFormat = ':remote-addy - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" (:response-time ms)';
     return express.logger(logFormat);
    */
    return morgan(function(t, req, res){
        var rTime = t['response-time'](req, res);
        var contentLength = t['res'](req, res, 'content-length');
        var status = t['status'](req, res);
        var url = t['url'](req, res);

        return t['remote-addy'](req, res)+' - - ['+
            t['date'](req, res)+'] "'+
            t['method'](req, res)+' '+
            url+' HTTP/'+
            t['http-version'](req, res)+'" '+
            status+' '+
            (contentLength || '-')+' "'+
            (t['referrer'](req, res) || '-')+'" "'+
            (t['user-agent'](req, res) || '-')+'" ('+
            rTime+' ms)';
    });
};


// inject dependency from controller function DI
HttpFramework_Express.prototype.buildInputs = function($rawRequest) {
    // POST - req.body
    // GET  - req.query
    // GET  - req.hash
    // URL  - req.params

    return _.pick($rawRequest, [
        "query",
        "hash",
        "params",
        "body"
    ]);
};