const config = require('config');
const os     = require('os');
const path = require('path');
const filelogs = require('filelogs');

/**
 * 生成一个 错误信息 对象
 */
exports.errorWrapper = function(obj) {
	obj = obj || {};
	var errcode = obj.errcode;
	var errmsg = obj.errmsg;
	if (!errcode || !errmsg) {
		errcode = -1;
		errmsg = '系统错误';
	}
	var error = new Error(errmsg);
	error.errcode = errcode;
	error.errmsg = errmsg;
	error.status = obj.status || 400;
	return error;
};

// 挂载 IP
exports.mountIP = function *(next){
  var ip = this.ip ||
    this.req.headers['x-real-ip'] ||
    this.req.headers['x-forwarded-for'] ||
    this.req.connection.remoteAddress ||
    this.req.socket.remoteAddress;

  /* istanbul ignore else */
  if (ip && ip.indexOf('::ffff:') === 0) {
    ip = ip.replace('::ffff:', '');
  }

  this.cleanIP = ip;
  yield next;
};


/**
 * 生成一个随机字符串
 */
var LETTER_NUMBER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
exports.randomString = function (length) {
  	var text = '';
  	for (var i = 0; i < length; ++i) {
    	text += LETTER_NUMBER.charAt(Math.floor(Math.random() * LETTER_NUMBER.length));
  	}
  	return text;
};

/**
  * require('./log')(name)
  *
  * @return {Function} log
  */
exports.getLogger = function(name){
  var options = {};
  options.name = name;
  options.dir = path.join(__dirname + config.logDir);
  var logConfig = config.logConfig || {};
  var level = logConfig[name] && logConfig[name].level || config.logLevel;
  var output = (logConfig[name] && logConfig[name].hasOwnProperty('output')) ? logConfig[name].output : config.logOutput;
  options.level = process.env.LEVEL || level;
  options.output = output;
  return filelogs(options);
};



const cpuLen = os.cpus().length;
const getMacIP = function () {
  let IPv4,hostName;
  hostName = os.hostname();
  for(let i=0; i<os.networkInterfaces().en0.length; i++) {
      if(os.networkInterfaces().en0[i].family=='IPv4') {
          IPv4 = os.networkInterfaces().en0[i].address;
      }
  }
  return {IPv4: IPv4, hostName: hostName};
}

const getUbuntuIP = function () {
  let IPv4,hostName;
  hostName = os.hostname();
  for(let i=0; i<os.networkInterfaces().eth0.length; i++){
      if(os.networkInterfaces().eth0[i].family=='IPv4'){
          IPv4 = os.networkInterfaces().eth0[i].address;
      }
  }
  return {IPv4: IPv4, hostName: hostName};
}

var info = getMacIP();
if (!info.IPv4 || !info.hostName) {
  info = getUbuntuIP() || {};
}

info.cpuLen = cpuLen;

exports.cpuInfo = info;