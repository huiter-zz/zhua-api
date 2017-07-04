const fs = require('fs');
const config = require('config');
const os     = require('os');
const path = require('path');
const filelogs = require('filelogs');
const qiniu = require('qiniu');

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

qiniu.conf.ACCESS_KEY = config.qiniu.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.qiniu.SECRET_KEY;
const bucketname = config.qiniu.bucketname;
exports.uploadFile = function (filename) {
  let putPolicy = new qiniu.rs.PutPolicy(bucketname);
  let uptoken = putPolicy.token();
  let extra = new qiniu.io.PutExtra();
  let localFile = path.join(__dirname, './snapshot/' + filename);
  try {
    let statObj = fs.statSync(localFile);
    console.log(statObj);
    if (!statObj || statObj.size < 30 * 1000) {
      console.error('图片数据获取错误 %s', localFile);    
      return Promise.reject(exports.errorWrapper({
        errcode: 40081,
        errmsg: '图片数据获取错误'
      }));
    }
  } catch (e) {
    console.error('图片不存在 %s error %s', localFile, e.message);
    console.log(e);   
    return Promise.reject(exports.errorWrapper({
      errcode: 40081,
      errmsg: '图片不存在'
    }));
  }
  return new Promise(function(resolve, reject) {
    qiniu.io.putFile(uptoken, filename, localFile, extra, function(err, ret) {
      /* istanbul ignore if */
      if (err && err.code === 614 && err.error === 'file exists') {
        var imageURL = config.qiniu.domain + filename;
        resolve(imageURL);
      } else if (err) {
        reject(exports.errorWrapper({
          errcode: 40081,
          errmsg: '上传文件失败，请重新上传'
        }));
      } else {
        var imageURL = config.qiniu.domain + filename;
        resolve(imageURL);
      }
    });
  });  
}


const cpuLen = os.cpus().length;
const getMacIP = function () {
  let IPv4,hostName;
  hostName = os.hostname();
  var networkInterfaces = os.networkInterfaces();
  if (networkInterfaces && networkInterfaces.en0 && networkInterfaces.en0.length) {
    for(let i=0; i<os.networkInterfaces().en0.length; i++) {
        if(os.networkInterfaces().en0[i].family=='IPv4') {
            IPv4 = os.networkInterfaces().en0[i].address;
        }
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