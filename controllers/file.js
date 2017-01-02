const qiniu = require('qiniu');
const crypto = require('crypto');
const config = require('config');
const _ = require('lodash');
const Log = require('../model').Log;
const errorWrapper = require('../utils').errorWrapper;

/**
 * 上传图片到七牛
 * @param {Binary} imageBuff 图片内容
 * @param {String} ext 图片后缀名
 * @param {Function} callback 上传成功或失败后的回调函数
 */
qiniu.conf.ACCESS_KEY = config.qiniu.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.qiniu.SECRET_KEY;
var bucketname = config.qiniu.bucketname;

const uploadImage = function(binaryBuff, ext, callback){
	/* istanbul ignore if */
	if(!ext) ext = '.jpg';
	var md5 = crypto.createHash('md5');
	md5.update(binaryBuff, 'binary');
	var key = md5.digest('hex') + ext;
	var binary = new Buffer(binaryBuff, 'binary');
	var putPolicy = new qiniu.rs.PutPolicy(bucketname);
	var uptoken = putPolicy.token();
	var extra = new qiniu.io.PutExtra();
	return new Promise(function(resolve, reject) {
		qiniu.io.put(uptoken, key, binary, extra, function(err, ret) {
			/* istanbul ignore if */
			if (err && err.code === 614 && err.error === 'file exists') {
				var imageURL = config.qiniu.domain + key;
				resolve(imageURL);
			} else if (err) {
				reject(errorWrapper({
					errcode: 40081,
					errmsg: '上传文件失败，请重新上传'
				}));
			} else {
				var imageURL = config.qiniu.domain + key;
				resolve(imageURL);
			}
		});
	});
};


// 修改信息
exports.upload = function *(next) {
	let file = this.request.files && this.request.files.file;
	let user = this.user;
	/* istanbul ignore if */
	if (!file) {
		this.status = 400;
		this.body = errorWrapper({
			errcode: 40081,
			errmsg: '上传文件失败，请重新上传'
		});
		return;
	}

	let ext = file.ext;
    let url = yield uploadImage(file.binaryBuff, ext);
	Log.create({
		user: user._id,
		type: Log.types('uploadFile'),
		ip: this.cleanIP,
		data: {
			url: url
		}
	});

	this.status = 200;
	this.body = {url: url};
	return;
};