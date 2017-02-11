/**
 * 页面信息
 */
'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var config = require('config');

var schema = module.exports = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
	page: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, default: 'http://oj54bwg6q.bkt.clouddn.com/587e017d83ef230b0ce2896b_20170118.png' },
  lastFetchTime: {type: Date }, //  上一次抓取页面时间
	tags: [String],
  setting: {
    size: [String],
    delay: Number
  },
  del: {type: Boolean, default: false},
  retryTimes: {type: Number, default: 0}, // 控制页面抓取重试次数
  canFetchTime: {type: Date, default: Date.now }, // 抓取页面错误时，锁定页面在一段时间内不再抓取
  // 页面状态： 正常，抓取中，抓取页面错误
  status: {type: String, enum: ['normal', 'fetching', 'exception'], default: 'normal'},
	createdTime: {type: Date, default: Date.now }
});

/* istanbul ignore else */
if (!schema.options.toJSON) {
  schema.options.toJSON = {};
}

schema.options.toJSON.transform = function (doc, ret) {
  ret.id = ret._id;
  delete ret.__v;
  delete ret._id;
  delete ret.del;
  ret.createdTime = ret.createdTime && ret.createdTime.valueOf();
};