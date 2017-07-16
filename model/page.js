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
  image: { type: String, default: 'https://omojllq5i.qnssl.com/default.png' },
  expectFetchTime: { // 预期抓取图片时间
    hour: {type: Number, default: 0},
    minute: {type: Number, default: 0}
  },
  lastFetchTime: {type: Date }, //  上一次抓取页面时间
	tags: [String],
  setting: {
    size: [String],
    delay: Number
  },
  del: {type: Boolean, default: false},
  startFetchTime: {type: Date}, // 最近一次开始抓取的时间
  retryTimes: {type: Number, default: 0}, // 控制页面抓取重试次数
  canFetchTime: {type: Date, default: Date.now }, // 抓取页面错误时，锁定页面在一段时间内不再抓取
  // 页面状态： 正常，抓取中，抓取页面错误
  status: {type: String, enum: ['normal', 'fetching', 'exception'], default: 'normal'},
  exception: {},
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