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
	tags: [String],
  setting: {
    size: [String],
    delay: Number
  },
  del: {type: Boolean, default: false},
  lastFetchTime: {type: Date, default: Date.now }, //  最后一次抓取页面时间
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