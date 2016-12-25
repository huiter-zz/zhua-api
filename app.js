const app = require('koa')();
const router = require('koa-router')();
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');
const cors = require('kcors');
const _ = require('lodash');
const config = require('config');
const loggerFile =  require('./utils').getLogger('error');
const session = require('koa-generic-session');
const MongoStore = require('koa-generic-session-mongo');

// middlewares
app.use(require('koa-bodyparser')());
app.use(json());
app.use(logger());

app.keys = ['TFyhw0lTx5YKKhUloJ1Dzr48', 'zhua-page'];
app.use(session({
  store: new MongoStore({
  	db: config.mongodb.database,
  	collection: 'sessions',
  	host: config.mongodb.host,
  	port: config.mongodb.port || 27017,
  	user: config.mongodb.user,
  	password: config.mongodb.password,
  }),
  key: 'zhua.sid',
  cookie: {
  	maxAge: 2 * 60 * 60 * 1000,
  	signed: false
  }
}));

var isString = function (s) {
	return typeof s === 'string' || s instanceof String;
};

var isOriginAllowed = function (origin, allowedOrigin) {
	if (Array.isArray(allowedOrigin)) {
		for (var i = 0; i < allowedOrigin.length; ++i) {
			if (isOriginAllowed(origin, allowedOrigin[i])) {
				return true;
			}
		}
		return false;
	} else if (isString(allowedOrigin)) {
		return origin === allowedOrigin;
	} else if (allowedOrigin instanceof RegExp) {
		return allowedOrigin.test(origin);
	} else {
		return !!allowedOrigin;
	}
};

//cors config function
var corsFn = function(ctx) {
	var whitelist = _.compact(_.map(config.corsWhiteList, function(item) {
	  if (item) {
	    return new RegExp(item);
	  } else {
	    return null;
	  }
	}));

	var requestOrigin = ctx.headers.origin;

	if (isOriginAllowed(requestOrigin, whitelist)) {
		return requestOrigin;
	} else {
		return false;
	}
}


var corsOptions = {
  origin: corsFn,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'If-Modified-Since', 'X-Session-ID', 'X-Media-Type', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// logger
app.use(function *(next){
  const start = new Date;
  yield next;
  const ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

onerror(app, {
	accepts: function (html, text, json) {
		return json;
	},
	all: function (err) {
		var errinfo;
		if (err.errcode && err.errmsg) {
			errinfo = err;
		} else {
			errinfo = {
				errcode: -1,
				errmsg: 'System error'
			}
		}
		this.body = errinfo;
	}
});

// 定时归档 log 日志任务
require('./crontab');

const index = require('./routes/index');
router.use('/', index.routes(), index.allowedMethods());
app.use(router.routes(), router.allowedMethods());

// response

app.on('error', function(err, ctx){
	loggerFile.error('server response error message %s', err.message);
});

module.exports = app;